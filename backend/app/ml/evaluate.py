import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

def evaluate_classifier_model(
    model: Any, 
    X_test: np.ndarray, 
    y_test: np.ndarray, 
    feature_names: List[str]
) -> Dict[str, Any]:
    """Calculates evaluation metrics, confusion matrix, and feature importances for a trained classifier."""
    y_pred = model.predict(X_test)
    
    # Calculate probabilities if available
    if hasattr(model, "predict_proba"):
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
        except Exception:
            y_proba = y_pred
    elif hasattr(model, "decision_function"):
        try:
            y_proba = model.decision_function(X_test)
        except Exception:
            y_proba = y_pred
    else:
        y_proba = y_pred

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    
    try:
        roc = float(roc_auc_score(y_test, y_proba))
    except Exception:
        roc = acc

    cm = confusion_matrix(y_test, y_pred)
    cm_list = cm.tolist()

    # Extract feature importance or coefficients
    importances = []
    if hasattr(model, "feature_importances_"):
        raw_imp = model.feature_importances_
        for name, imp in zip(feature_names, raw_imp):
            importances.append({"feature": name, "importance": round(float(imp), 4)})
        importances.sort(key=lambda x: abs(x["importance"]), reverse=True)
    elif hasattr(model, "coef_"):
        raw_coef = model.coef_[0] if len(model.coef_.shape) > 1 else model.coef_
        for name, coef in zip(feature_names, raw_coef):
            importances.append({"feature": name, "importance": round(float(coef), 4)})
        importances.sort(key=lambda x: abs(x["importance"]), reverse=True)

    return {
        "accuracy": round(acc * 100, 2),
        "precision": round(prec * 100, 2),
        "recall": round(rec * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "roc_auc": round(roc * 100, 2),
        "confusion_matrix": cm_list,
        "feature_importances": importances[:15]  # Top 15 features
    }
