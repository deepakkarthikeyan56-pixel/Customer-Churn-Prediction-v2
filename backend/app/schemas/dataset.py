from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime

class ColumnValidationInfo(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]
    is_numerical: bool
    is_categorical: bool
    is_id_candidate: bool
    is_target_candidate: bool

class ValidationCheckResult(BaseModel):
    is_valid: bool
    checks: List[Dict[str, Any]]
    warnings: List[str]
    errors: List[str]
    total_rows: int
    total_columns: int
    duplicate_rows: int
    missing_values_total: int
    numerical_columns: List[str]
    categorical_columns: List[str]
    id_columns: List[str]
    detected_target_column: Optional[str]
    detected_target_classes: Optional[List[str]]

class DatasetConfigUpdate(BaseModel):
    target_column: str
    id_column: Optional[str] = None
    numerical_columns: Optional[List[str]] = None
    categorical_columns: Optional[List[str]] = None

class DatasetResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    rows_count: int
    columns_count: int
    target_column: Optional[str]
    target_classes: Optional[List[str]]
    feature_meta: Optional[Dict[str, Any]]
    validation_status: Optional[Dict[str, Any]]
    is_active: bool
    uploaded_at: datetime.datetime

    class Config:
        from_attributes = True

class DatasetPreviewResponse(BaseModel):
    dataset: DatasetResponse
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int

class DatasetAnalysisResponse(BaseModel):
    dataset_id: int
    filename: str
    rows_count: int
    columns_count: int
    target_column: Optional[str] = None
    target_distribution: Optional[Any] = None
    numerical_stats: Dict[str, Dict[str, Any]]
    categorical_stats: Dict[str, Dict[str, Any]]
    charts_data: Dict[str, Any]
