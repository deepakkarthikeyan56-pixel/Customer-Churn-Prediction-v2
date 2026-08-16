import os
import joblib
from typing import Dict, Any, Optional

_MODEL_CACHE: Dict[str, Any] = {}

def get_loaded_model(model_path: str) -> Dict[str, Any]:
    """Retrieves model package from memory cache or loads from disk."""
    if model_path in _MODEL_CACHE:
        return _MODEL_CACHE[model_path]
        
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
        
    model_pkg = joblib.load(model_path)
    _MODEL_CACHE[model_path] = model_pkg
    return model_pkg

def clear_model_cache(model_path: Optional[str] = None):
    if model_path and model_path in _MODEL_CACHE:
        del _MODEL_CACHE[model_path]
    elif model_path is None:
        _MODEL_CACHE.clear()
