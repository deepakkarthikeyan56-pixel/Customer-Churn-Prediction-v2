import os
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Dataset, TrainedModel, User
from app.schemas.model import (
    ModelTrainingRequest, ModelComparisonResponse, SingleModelMetric
)
from app.auth.jwt_handler import get_current_user
from app.ml.train import train_and_compare_models
from app.ml.model_manager import get_loaded_model

router = APIRouter(prefix="/api/models", tags=["Machine Learning Models"])

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "trained_models")
os.makedirs(MODELS_DIR, exist_ok=True)

@router.post("/train", response_model=ModelComparisonResponse)
def train_models_endpoint(
    payload: ModelTrainingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset or not os.path.exists(dataset.filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found. Please upload a dataset first."
        )

    if not dataset.target_column:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target column selected for this dataset. Please configure the target column first."
        )

    try:
        df = pd.read_csv(dataset.filepath)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read dataset: {str(e)}"
        )

    # Validate target column has at least 2 distinct classes
    if dataset.target_column not in df.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target column '{dataset.target_column}' is missing from the dataset file."
        )

    unique_targets = df[dataset.target_column].dropna().unique()
    if len(unique_targets) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to train the model because the selected target column contains only {len(unique_targets)} class. Please select a column containing both churn and non-churn records."
        )

    id_columns = []
    if dataset.feature_meta and "id_columns" in dataset.feature_meta:
        id_columns = dataset.feature_meta["id_columns"]

    # Deactivate existing models for this dataset
    db.query(TrainedModel).filter(TrainedModel.dataset_id == dataset.id).update({"is_active": False, "is_best": False})

    training_results = train_and_compare_models(
        df=df,
        target_column=dataset.target_column,
        id_columns=id_columns,
        algorithms=payload.algorithms or [
            "Logistic Regression",
            "Decision Tree",
            "Random Forest",
            "Gradient Boosting"
        ],
        dataset_id=dataset.id,
        user_id=current_user.id,
        save_dir=MODELS_DIR,
        test_size=payload.test_size,
        random_state=payload.random_state
    )

    db_models = []
    best_model_obj = None

    for m_res in training_results["results"]:
        db_model = TrainedModel(
            dataset_id=dataset.id,
            user_id=current_user.id,
            algorithm_name=m_res["algorithm_name"],
            accuracy=m_res["accuracy"],
            precision=m_res["precision"],
            recall=m_res["recall"],
            f1_score=m_res["f1_score"],
            roc_auc=m_res["roc_auc"],
            confusion_matrix=m_res["confusion_matrix"],
            feature_importances=m_res["feature_importances"],
            training_time=m_res["training_time"],
            model_path=m_res["model_path"],
            is_best=m_res["is_best"],
            is_active=m_res["is_best"]  # Best model is active by default
        )
        db.add(db_model)
        db_models.append(db_model)
        if m_res["is_best"]:
            best_model_obj = db_model

    db.commit()
    for m in db_models:
        db.refresh(m)

    if not best_model_obj and db_models:
        best_model_obj = db_models[0]

    model_metrics = [
        SingleModelMetric(
            id=m.id,
            algorithm_name=m.algorithm_name,
            accuracy=m.accuracy,
            precision=m.precision,
            recall=m.recall,
            f1_score=m.f1_score,
            roc_auc=m.roc_auc,
            training_time=m.training_time,
            confusion_matrix=m.confusion_matrix,
            feature_importances=m.feature_importances,
            is_best=m.is_best,
            is_active=m.is_active,
            created_at=m.created_at
        ) for m in db_models
    ]

    return ModelComparisonResponse(
        dataset_id=dataset.id,
        dataset_filename=dataset.filename,
        best_model_id=best_model_obj.id if best_model_obj else 0,
        best_algorithm=best_model_obj.algorithm_name if best_model_obj else "",
        best_f1_score=best_model_obj.f1_score if best_model_obj else 0.0,
        best_roc_auc=best_model_obj.roc_auc if best_model_obj else 0.0,
        total_training_time=training_results["total_training_time"],
        models=model_metrics
    )


@router.get("/comparison/{dataset_id}", response_model=ModelComparisonResponse)
def get_model_comparison(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    models = db.query(TrainedModel).filter(
        TrainedModel.dataset_id == dataset_id, 
        TrainedModel.user_id == current_user.id
    ).order_by(TrainedModel.f1_score.desc()).all()

    if not models:
        raise HTTPException(status_code=404, detail="No models trained yet for this dataset.")

    best_model = next((m for m in models if m.is_best), models[0])

    model_metrics = [
        SingleModelMetric(
            id=m.id,
            algorithm_name=m.algorithm_name,
            accuracy=m.accuracy,
            precision=m.precision,
            recall=m.recall,
            f1_score=m.f1_score,
            roc_auc=m.roc_auc,
            training_time=m.training_time,
            confusion_matrix=m.confusion_matrix,
            feature_importances=m.feature_importances,
            is_best=m.is_best,
            is_active=m.is_active,
            created_at=m.created_at
        ) for m in models
    ]

    total_time = round(sum(m.training_time for m in models), 2)

    return ModelComparisonResponse(
        dataset_id=dataset.id,
        dataset_filename=dataset.filename,
        best_model_id=best_model.id,
        best_algorithm=best_model.algorithm_name,
        best_f1_score=best_model.f1_score,
        best_roc_auc=best_model.roc_auc,
        total_training_time=total_time,
        models=model_metrics
    )


@router.get("/active")
def get_active_model_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the currently active trained model along with its feature schema for dynamic form rendering."""
    active_model = db.query(TrainedModel).filter(
        TrainedModel.user_id == current_user.id,
        TrainedModel.is_active == True
    ).first()

    if not active_model:
        active_model = db.query(TrainedModel).filter(
            TrainedModel.user_id == current_user.id
        ).order_by(TrainedModel.f1_score.desc()).first()

    if not active_model or not os.path.exists(active_model.model_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model available. Please train your models first."
        )

    model_pkg = get_loaded_model(active_model.model_path)
    metadata = model_pkg["metadata"]

    return {
        "model_id": active_model.id,
        "algorithm_name": active_model.algorithm_name,
        "accuracy": active_model.accuracy,
        "f1_score": active_model.f1_score,
        "roc_auc": active_model.roc_auc,
        "dataset_id": active_model.dataset_id,
        "feature_columns": metadata["feature_columns"],
        "numerical_cols": metadata["numerical_cols"],
        "categorical_cols": metadata["categorical_cols"],
        "categorical_unique_values": metadata["categorical_unique_values"],
        "numerical_ranges": metadata["numerical_ranges"]
    }


@router.post("/{model_id}/set-default")
def set_active_default_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    model = db.query(TrainedModel).filter(
        TrainedModel.id == model_id, 
        TrainedModel.user_id == current_user.id
    ).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Unset all models active for user
    db.query(TrainedModel).filter(TrainedModel.user_id == current_user.id).update({"is_active": False})
    model.is_active = True
    db.commit()

    return {"message": f"'{model.algorithm_name}' is now set as the active prediction model."}
