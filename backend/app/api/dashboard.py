import os
import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.db import get_db
from app.database.models import Dataset, TrainedModel, PredictionRecord, User
from app.schemas.prediction import DashboardSummaryResponse, PredictionHistoryItem
from app.auth.jwt_handler import get_current_user
from app.utils.data_profiler import compute_dataset_statistics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Statistics"])

@router.get("/stats", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve active dataset
    active_dataset = db.query(Dataset).filter(
        Dataset.user_id == current_user.id, 
        Dataset.is_active == True
    ).first()

    if not active_dataset:
        active_dataset = db.query(Dataset).filter(
            Dataset.user_id == current_user.id
        ).order_by(Dataset.uploaded_at.desc()).first()

    total_customers = 0
    churned_customers = 0
    non_churned_customers = 0
    churn_rate = 0.0
    charts_data = {}

    if active_dataset and os.path.exists(active_dataset.filepath):
        try:
            df = pd.read_csv(active_dataset.filepath)
            total_customers = len(df)
            tgt = active_dataset.target_column
            if tgt and tgt in df.columns:
                val_counts = df[tgt].dropna().value_counts()
                # Positive patterns
                pos_keys = [k for k in val_counts.index if str(k).strip().lower() in ["yes", "1", "true", "churn", "exited", "churned"]]
                if pos_keys:
                    churned_customers = int(val_counts[pos_keys[0]])
                elif len(val_counts) >= 2:
                    churned_customers = int(val_counts.iloc[1])
                else:
                    churned_customers = int(val_counts.iloc[0])
                    
                non_churned_customers = total_customers - churned_customers
                churn_rate = round((churned_customers / total_customers) * 100, 1) if total_customers > 0 else 0.0

            stats = compute_dataset_statistics(df, target_col=active_dataset.target_column)
            charts_data = stats["charts_data"]
        except Exception:
            pass

    # Best model
    best_model = db.query(TrainedModel).filter(
        TrainedModel.user_id == current_user.id,
        TrainedModel.is_best == True
    ).first()

    if not best_model:
        best_model = db.query(TrainedModel).filter(
            TrainedModel.user_id == current_user.id
        ).order_by(TrainedModel.f1_score.desc()).first()

    # Total predictions
    total_preds = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == current_user.id
    ).count()

    # Latest 5 predictions
    latest_db_preds = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == current_user.id
    ).order_by(desc(PredictionRecord.created_at)).limit(5).all()

    latest_items = []
    for r in latest_db_preds:
        model_name = r.model.algorithm_name if r.model else "Classifier"
        latest_items.append(PredictionHistoryItem(
            id=r.id,
            customer_identifier=r.customer_identifier,
            model_name=model_name,
            prediction=r.prediction,
            churn_probability=r.churn_probability,
            retention_probability=r.retention_probability,
            risk_level=r.risk_level,
            input_data=r.input_data,
            top_factors=r.top_factors,
            created_at=r.created_at
        ))

    return DashboardSummaryResponse(
        total_customers=total_customers,
        churned_customers=churned_customers,
        non_churned_customers=non_churned_customers,
        churn_rate=churn_rate,
        total_predictions=total_preds,
        current_best_model=best_model.algorithm_name if best_model else None,
        best_model_accuracy=best_model.accuracy if best_model else None,
        best_model_f1=best_model.f1_score if best_model else None,
        latest_predictions=latest_items,
        charts=charts_data
    )
