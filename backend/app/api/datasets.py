import os
import shutil
import uuid
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.database.models import Dataset, User, TrainedModel
from app.schemas.dataset import (
    DatasetResponse, DatasetPreviewResponse, DatasetConfigUpdate,
    DatasetAnalysisResponse, ValidationCheckResult
)
from app.auth.jwt_handler import get_current_user
from app.utils.data_profiler import profile_csv_dataset, compute_dataset_statistics

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
SAMPLE_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
    "sample_data", 
    "telco_customer_churn.csv"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    target_column_override: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files (.csv) are supported."
        )

    unique_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    saved_filepath = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(saved_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Read and validate CSV
    try:
        df = pd.read_csv(saved_filepath)
    except Exception as e:
        if os.path.exists(saved_filepath):
            os.remove(saved_filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse CSV file. Error: {str(e)}"
        )

    if df.empty or len(df) == 0:
        if os.path.exists(saved_filepath):
            os.remove(saved_filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV dataset is empty."
        )

    # Profile dataset
    profile = profile_csv_dataset(df)
    
    target_col = target_column_override or profile["detected_target_column"]
    target_classes = profile["detected_target_classes"]
    if target_column_override and target_column_override in df.columns:
        target_classes = [str(x) for x in sorted(df[target_column_override].dropna().unique())]

    # Deactivate other datasets for this user as primary
    db.query(Dataset).filter(Dataset.user_id == current_user.id).update({"is_active": False})

    new_dataset = Dataset(
        user_id=current_user.id,
        filename=file.filename,
        filepath=saved_filepath,
        rows_count=len(df),
        columns_count=len(df.columns),
        target_column=target_col,
        target_classes=target_classes,
        feature_meta=profile,
        validation_status={
            "is_valid": profile["is_valid"],
            "checks": profile["checks"],
            "warnings": profile["warnings"],
            "errors": profile["errors"]
        },
        is_active=True
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return new_dataset


@router.post("/load-sample", response_model=DatasetResponse)
def load_sample_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Loads the pre-packaged Kaggle Telco Customer Churn dataset instantly for testing."""
    if not os.path.exists(SAMPLE_DATA_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample dataset file not found on server."
        )

    unique_filename = f"sample_{uuid.uuid4().hex[:8]}_telco_customer_churn.csv"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    shutil.copyfile(SAMPLE_DATA_PATH, dest_path)

    df = pd.read_csv(dest_path)
    profile = profile_csv_dataset(df)

    db.query(Dataset).filter(Dataset.user_id == current_user.id).update({"is_active": False})

    new_dataset = Dataset(
        user_id=current_user.id,
        filename="Telco_Customer_Churn_Kaggle.csv",
        filepath=dest_path,
        rows_count=len(df),
        columns_count=len(df.columns),
        target_column="Churn",
        target_classes=["No", "Yes"],
        feature_meta=profile,
        validation_status={
            "is_valid": profile["is_valid"],
            "checks": profile["checks"],
            "warnings": profile["warnings"],
            "errors": profile["errors"]
        },
        is_active=True
    )
    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    return new_dataset


@router.get("/", response_model=List[DatasetResponse])
def list_user_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.uploaded_at.desc()).all()


@router.get("/active", response_model=DatasetResponse)
def get_active_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.user_id == current_user.id, Dataset.is_active == True).first()
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == current_user.id).order_by(Dataset.uploaded_at.desc()).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dataset found. Please upload a dataset first."
        )
    return dataset


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset_by_id(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: int,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset or not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail="Dataset file not found")

    try:
        df = pd.read_csv(dataset.filepath)
        df_preview = df.head(limit).fillna("")
        records = df_preview.to_dict(orient="records")
        return {
            "dataset": dataset,
            "columns": list(df.columns),
            "rows": records,
            "total_rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")


@router.post("/{dataset_id}/configure", response_model=DatasetResponse)
def configure_dataset(
    dataset_id: int,
    payload: DatasetConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset or not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = pd.read_csv(dataset.filepath)
    if payload.target_column not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail=f"Target column '{payload.target_column}' does not exist in dataset."
        )

    # Re-profile with updated target
    profile = profile_csv_dataset(df)
    target_classes = [str(x) for x in sorted(df[payload.target_column].dropna().unique())]

    dataset.target_column = payload.target_column
    dataset.target_classes = target_classes
    if payload.id_column:
        if payload.id_column in df.columns and payload.id_column not in profile["id_columns"]:
            profile["id_columns"].append(payload.id_column)
    dataset.feature_meta = profile
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/{dataset_id}/random-sample")
def get_random_customer_sample(
    dataset_id: int,
    churn_type: Optional[str] = Query(None), # 'churn', 'loyal', or None (random)
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset or not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = pd.read_csv(dataset.filepath)
    tgt = dataset.target_column
    
    if churn_type and tgt and tgt in df.columns:
        # Filter for churn or loyal rows
        if churn_type == 'churn':
            sub = df[df[tgt].astype(str).str.lower().isin(['yes', '1', 'true', 'churn'])]
        else:
            sub = df[df[tgt].astype(str).str.lower().isin(['no', '0', 'false', 'retained'])]
        if not sub.empty:
            sample_row = sub.sample(1).iloc[0].fillna("").to_dict()
        else:
            sample_row = df.sample(1).iloc[0].fillna("").to_dict()
    else:
        sample_row = df.sample(1).iloc[0].fillna("").to_dict()

    return {
        "dataset_id": dataset.id,
        "sample": sample_row,
        "actual_target": sample_row.get(tgt) if tgt else None
    }


@router.get("/{dataset_id}/analysis", response_model=DatasetAnalysisResponse)
def get_dataset_analysis(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset or not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = pd.read_csv(dataset.filepath)
    stats = compute_dataset_statistics(df, target_col=dataset.target_column)

    return {
        "dataset_id": dataset.id,
        "filename": dataset.filename,
        "rows_count": len(df),
        "columns_count": len(df.columns),
        "target_column": dataset.target_column,
        "target_distribution": stats["charts_data"].get("target_distribution"),
        "numerical_stats": stats["numerical_stats"],
        "categorical_stats": stats["categorical_stats"],
        "charts_data": stats["charts_data"]
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(dataset.filepath):
        try:
            os.remove(dataset.filepath)
        except Exception:
            pass

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}
