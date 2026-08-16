import os
import sys
import pandas as pd
from app.database.db import init_db, SessionLocal
from app.database.models import User, Dataset, TrainedModel, PredictionRecord
from app.auth.jwt_handler import hash_password, verify_password, create_access_token
from app.utils.data_profiler import profile_csv_dataset, compute_dataset_statistics
from app.ml.train import train_and_compare_models
from app.ml.predict import predict_single_customer, predict_batch_customers

print("--- Starting Backend Component Verification ---")

# 1. DB Init
init_db()
db = SessionLocal()

# 2. Auth test
test_email = "testuser@aids.edu"
db.query(User).filter(User.email == test_email).delete()
db.commit()

hashed = hash_password("secret123")
assert verify_password("secret123", hashed), "Password verification failed"
print("[OK] Auth & Password Hashing: PASSED")

user = User(name="Test Student", email=test_email, password_hash=hashed)
db.add(user)
db.commit()
db.refresh(user)
print(f"[OK] User created with ID: {user.id}")

# 3. Profiling sample CSV
sample_csv = os.path.join(os.path.dirname(__file__), "sample_data", "telco_customer_churn.csv")
assert os.path.exists(sample_csv), f"Sample CSV missing at {sample_csv}"

df = pd.read_csv(sample_csv)
profile = profile_csv_dataset(df)
assert profile["is_valid"], "Profile validation failed"
assert profile["detected_target_column"] == "Churn", f"Unexpected target: {profile['detected_target_column']}"
print(f"[OK] Dataset Profiler: PASSED (Rows: {profile['total_rows']}, Cols: {profile['total_columns']}, Target: {profile['detected_target_column']})")

stats = compute_dataset_statistics(df, target_col="Churn")
assert "target_distribution" in stats["charts_data"], "Target distribution chart data missing"
print("[OK] Dataset Statistical Profiler & Visualizations: PASSED")

# 4. Create Dataset record
ds = Dataset(
    user_id=user.id,
    filename="telco_customer_churn.csv",
    filepath=sample_csv,
    rows_count=len(df),
    columns_count=len(df.columns),
    target_column="Churn",
    target_classes=["No", "Yes"],
    feature_meta=profile,
    validation_status={"is_valid": True},
    is_active=True
)
db.add(ds)
db.commit()
db.refresh(ds)
print(f"[OK] Dataset DB Record created with ID: {ds.id}")

# 5. Train & Compare 4 ML Algorithms
models_dir = os.path.join(os.path.dirname(__file__), "trained_models")
train_res = train_and_compare_models(
    df=df,
    target_column="Churn",
    id_columns=profile["id_columns"],
    algorithms=["Logistic Regression", "Decision Tree", "Random Forest", "Gradient Boosting"],
    dataset_id=ds.id,
    user_id=user.id,
    save_dir=models_dir,
    test_size=0.2,
    random_state=42
)

print(f"[OK] Model Training Completed in {train_res['total_training_time']}s")
print(f"  Best Algorithm: {train_res['best_algorithm']}")

best_model_path = None
for r in train_res["results"]:
    print(f"  - {r['algorithm_name']:20s} | Acc: {r['accuracy']:.1f}% | F1: {r['f1_score']:.1f}% | AUC: {r['roc_auc']:.1f}% | Time: {r['training_time']}s | Best: {r['is_best']}")
    if r["is_best"]:
        best_model_path = r["model_path"]
        
    db_m = TrainedModel(
        dataset_id=ds.id,
        user_id=user.id,
        algorithm_name=r["algorithm_name"],
        accuracy=r["accuracy"],
        precision=r["precision"],
        recall=r["recall"],
        f1_score=r["f1_score"],
        roc_auc=r["roc_auc"],
        confusion_matrix=r["confusion_matrix"],
        feature_importances=r["feature_importances"],
        training_time=r["training_time"],
        model_path=r["model_path"],
        is_best=r["is_best"],
        is_active=r["is_best"]
    )
    db.add(db_m)
db.commit()

# 6. Single Customer Prediction & Explanation
test_customer = {
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "No",
    "Dependents": "No",
    "tenure": 2,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "OnlineBackup": "No",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "Yes",
    "StreamingMovies": "Yes",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 95.5,
    "TotalCharges": 191.0
}

single_pred = predict_single_customer(best_model_path, test_customer)
print("[OK] Single Prediction Test:")
print(f"  Prediction: {single_pred['prediction']} | Churn Prob: {single_pred['churn_probability']}% | Retention: {single_pred['retention_probability']}% | Risk: {single_pred['risk_level']}")
print(f"  Top Factors: {[f['feature'] + ': ' + f['impact'] for f in single_pred['top_factors']]}")

# 7. Batch Customer Prediction
batch_out = os.path.join(os.path.dirname(__file__), "uploads", "test_batch_out.csv")
batch_res = predict_batch_customers(best_model_path, df.head(20), batch_out)
print("[OK] Batch Prediction Test:")
print(f"  Total Processed: {batch_res['total_records']}, Churn: {batch_res['churn_count']}, Non-Churn: {batch_res['non_churn_count']}, High Risk: {batch_res['high_risk_count']}")
assert os.path.exists(batch_out), "Batch output CSV was not created"

db.close()
print("\nALL BACKEND CORE COMPONENTS VERIFIED & FULLY FUNCTIONAL!")
