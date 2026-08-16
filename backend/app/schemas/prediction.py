from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import datetime

class SinglePredictionRequest(BaseModel):
    dataset_id: Optional[int] = None
    model_id: Optional[int] = None
    customer_identifier: Optional[str] = None
    features: Dict[str, Any]

class RiskFactor(BaseModel):
    feature: str
    value: Any
    impact: str  # 'Increases Churn Risk' or 'Decreases Churn Risk'
    importance: float

class SinglePredictionResponse(BaseModel):
    prediction_id: Optional[int] = None
    model_id: int
    algorithm_name: str
    customer_identifier: Optional[str]
    prediction: str  # 'Churn' or 'No Churn'
    prediction_raw: int  # 1 or 0
    churn_probability: float  # e.g., 82.4
    retention_probability: float  # e.g., 17.6
    risk_level: str  # 'High Risk', 'Medium Risk', 'Low Risk'
    top_factors: List[RiskFactor]
    input_data: Dict[str, Any]
    created_at: datetime.datetime

class BatchPredictionItem(BaseModel):
    row_index: int
    customer_identifier: Optional[str]
    prediction: str
    churn_probability: float
    retention_probability: float
    risk_level: str
    features: Dict[str, Any]

class BatchPredictionResponse(BaseModel):
    model_id: int
    algorithm_name: str
    total_records: int
    churn_count: int
    non_churn_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    results_preview: List[BatchPredictionItem]
    download_url: Optional[str] = None

class PredictionHistoryItem(BaseModel):
    id: int
    customer_identifier: Optional[str]
    model_name: Optional[str]
    prediction: str
    churn_probability: float
    retention_probability: float
    risk_level: str
    input_data: Dict[str, Any]
    top_factors: Optional[List[Dict[str, Any]]]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    total_customers: int
    churned_customers: int
    non_churned_customers: int
    churn_rate: float
    total_predictions: int
    current_best_model: Optional[str]
    best_model_accuracy: Optional[float]
    best_model_f1: Optional[float]
    latest_predictions: List[PredictionHistoryItem]
    charts: Dict[str, Any]
