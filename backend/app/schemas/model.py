from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime

class ModelTrainingRequest(BaseModel):
    dataset_id: int
    algorithms: Optional[List[str]] = [
        "Logistic Regression",
        "Decision Tree",
        "Random Forest",
        "Gradient Boosting"
    ]
    test_size: float = 0.20
    random_state: int = 42

class SingleModelMetric(BaseModel):
    id: Optional[int] = None
    algorithm_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    training_time: float
    confusion_matrix: Optional[List[List[int]]] = None
    feature_importances: Optional[List[Dict[str, Any]]] = None
    is_best: bool = False
    is_active: bool = True
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ModelComparisonResponse(BaseModel):
    dataset_id: int
    dataset_filename: str
    best_model_id: int
    best_algorithm: str
    best_f1_score: float
    best_roc_auc: float
    total_training_time: float
    models: List[SingleModelMetric]
