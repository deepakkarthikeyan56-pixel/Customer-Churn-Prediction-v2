import time
import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from app.ml.preprocessing import ChurnPreprocessor
from app.ml.evaluate import evaluate_classifier_model

MODEL_REGISTRY = {
    "Logistic Regression": lambda random_state: LogisticRegression(
        C=1.0,
        max_iter=1000, 
        random_state=random_state,
        class_weight="balanced"
    ),
    "Decision Tree": lambda random_state: DecisionTreeClassifier(
        max_depth=6, 
        min_samples_split=8,
        min_samples_leaf=3,
        random_state=random_state,
        class_weight="balanced"
    ),
    "Random Forest": lambda random_state: RandomForestClassifier(
        n_estimators=150, 
        max_depth=12, 
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=random_state,
        class_weight="balanced",
        n_jobs=-1
    ),
    "Gradient Boosting": lambda random_state: GradientBoostingClassifier(
        n_estimators=150, 
        learning_rate=0.08, 
        max_depth=4, 
        subsample=0.85,
        random_state=random_state
    )
}

def train_and_compare_models(
    df: pd.DataFrame,
    target_column: str,
    id_columns: List[str],
    algorithms: List[str],
    dataset_id: int,
    user_id: int,
    save_dir: str,
    test_size: float = 0.20,
    random_state: int = 42
) -> Dict[str, Any]:
    """Preprocesses dataset once and trains multiple algorithms with exact timing and evaluation."""
    os.makedirs(save_dir, exist_ok=True)
    
    # 1. Preprocess dataset once
    preprocessor = ChurnPreprocessor(target_column=target_column, id_columns=id_columns)
    X_train, X_test, y_train, y_test, metadata = preprocessor.fit_transform_dataset(
        df=df, test_size=test_size, random_state=random_state
    )
    
    trained_models_results = []
    best_score = -1.0
    best_model_name = None
    
    total_start_time = time.perf_counter()
    
    for algo_name in algorithms:
        if algo_name not in MODEL_REGISTRY:
            continue
            
        model_factory = MODEL_REGISTRY[algo_name]
        clf = model_factory(random_state)
        
        # Measure fast model training time
        t0 = time.perf_counter()
        clf.fit(X_train, y_train)
        training_time = round(time.perf_counter() - t0, 3)
        
        # Evaluate model metrics
        metrics = evaluate_classifier_model(
            model=clf,
            X_test=X_test,
            y_test=y_test,
            feature_names=metadata["transformed_feature_names"]
        )
        
        # Combined score for best model selection (weighted 50% F1-score, 50% ROC-AUC to balance precision/recall)
        combined_score = 0.5 * metrics["f1_score"] + 0.5 * metrics["roc_auc"]
        
        # Save model package (clf + preprocessor)
        clean_name = algo_name.lower().replace(" ", "_")
        filename = f"user_{user_id}_ds_{dataset_id}_{clean_name}.joblib"
        model_filepath = os.path.join(save_dir, filename)
        
        model_package = {
            "algorithm_name": algo_name,
            "classifier": clf,
            "preprocessor": preprocessor,
            "metadata": metadata,
            "metrics": metrics,
            "created_at": time.time()
        }
        
        joblib.dump(model_package, model_filepath)
        
        trained_models_results.append({
            "algorithm_name": algo_name,
            "accuracy": metrics["accuracy"],
            "precision": metrics["precision"],
            "recall": metrics["recall"],
            "f1_score": metrics["f1_score"],
            "roc_auc": metrics["roc_auc"],
            "confusion_matrix": metrics["confusion_matrix"],
            "feature_importances": metrics["feature_importances"],
            "training_time": training_time,
            "model_path": model_filepath,
            "combined_score": combined_score
        })
        
        if combined_score > best_score:
            best_score = combined_score
            best_model_name = algo_name
            
    total_training_time = round(time.perf_counter() - total_start_time, 2)
    
    # Mark is_best
    for item in trained_models_results:
        item["is_best"] = (item["algorithm_name"] == best_model_name)

    return {
        "best_algorithm": best_model_name,
        "total_training_time": total_training_time,
        "metadata": metadata,
        "results": trained_models_results
    }
