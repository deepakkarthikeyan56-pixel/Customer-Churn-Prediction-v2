import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional

COMMON_TARGET_NAMES = [
    "churn", "exited", "customerstatus", "churn_value", "churned", 
    "is_churn", "churn_label", "attrition", "status", "target"
]

COMMON_ID_PATTERNS = [
    "id", "customerid", "customer_id", "userid", "user_id", 
    "account_id", "accountnumber", "client_id", "cid"
]

def profile_csv_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Profiles a pandas dataframe, detects column types, missing values, candidate target & ID columns."""
    total_rows, total_cols = df.shape
    duplicate_rows = int(df.duplicated().sum())
    
    col_profiles = []
    numerical_cols = []
    categorical_cols = []
    id_candidates = []
    target_candidates = []
    single_value_cols = []
    high_cardinality_cols = []
    
    total_missing = int(df.isna().sum().sum())

    for col in df.columns:
        series = df[col]
        missing_cnt = int(series.isna().sum())
        missing_pct = round((missing_cnt / total_rows) * 100, 2) if total_rows > 0 else 0
        unique_cnt = int(series.nunique(dropna=True))
        
        # Check if numeric
        # Try numeric conversion if object column might be numeric with empty strings (e.g. TotalCharges)
        is_num = False
        if pd.api.types.is_numeric_dtype(series):
            is_num = True
        else:
            # Check if majority can be coerced to numeric
            try:
                coerced = pd.to_numeric(series.astype(str).str.strip(), errors='coerce')
                valid_num_ratio = coerced.notna().mean()
                if valid_num_ratio > 0.8:
                    is_num = True
            except Exception:
                is_num = False
                
        is_cat = not is_num
        
        # Check if ID candidate
        clean_name = str(col).strip().lower().replace("_", "").replace("-", "")
        is_id = False
        if any(p == clean_name or clean_name.startswith(p) or clean_name.endswith(p) for p in COMMON_ID_PATTERNS):
            is_id = True
        elif unique_cnt >= total_rows * 0.95 and is_cat and total_rows > 10:
            is_id = True
            
        if is_id:
            id_candidates.append(col)
            
        # Check if Target candidate
        is_target = False
        if any(t == clean_name for t in COMMON_TARGET_NAMES):
            is_target = True
        elif unique_cnt == 2 and not is_id and (is_cat or is_num):
            # 2 unique values candidate
            is_target = True
            
        if is_target:
            target_candidates.append(col)
            
        if unique_cnt == 1 and total_rows > 1:
            single_value_cols.append(col)
            
        if is_cat and unique_cnt > 50 and not is_id:
            high_cardinality_cols.append(col)
            
        if is_num and not is_id:
            numerical_cols.append(col)
        elif is_cat and not is_id:
            categorical_cols.append(col)
            
        # Sample non-null values
        sample_vals = series.dropna().unique()[:5].tolist()
        # Convert NumPy types to native python
        sample_vals = [int(v) if isinstance(v, (np.integer, int)) else float(v) if isinstance(v, (np.floating, float)) else str(v) for v in sample_vals]
        
        col_profiles.append({
            "name": str(col),
            "dtype": str(series.dtype),
            "missing_count": missing_cnt,
            "missing_percentage": missing_pct,
            "unique_count": unique_cnt,
            "sample_values": sample_vals,
            "is_numerical": is_num,
            "is_categorical": is_cat,
            "is_id_candidate": is_id,
            "is_target_candidate": is_target
        })
        
    # Best guess for target column
    detected_target = None
    target_classes = None
    for cand in target_candidates:
        clean_cand = str(cand).strip().lower().replace("_", "").replace("-", "")
        if any(t == clean_cand for t in COMMON_TARGET_NAMES):
            detected_target = cand
            break
    if not detected_target and target_candidates:
        detected_target = target_candidates[0]
        
    if detected_target and detected_target in df.columns:
        target_series = df[detected_target].dropna()
        target_classes = [str(x) for x in sorted(target_series.unique())]
        
    # Build validation checks list
    checks = []
    warnings = []
    errors = []
    
    # 1. Non-empty check
    if total_rows > 0:
        checks.append({"name": "Dataset Loaded", "status": "passed", "message": f"Successfully loaded {total_rows} rows and {total_cols} columns."})
    else:
        checks.append({"name": "Dataset Loaded", "status": "failed", "message": "CSV file contains zero rows."})
        errors.append("Dataset is empty.")
        
    # 2. Target column check
    if detected_target:
        checks.append({"name": "Target Column Detection", "status": "passed", "message": f"Identified '{detected_target}' as candidate target with classes: {target_classes}."})
    else:
        checks.append({"name": "Target Column Detection", "status": "warning", "message": "No obvious Churn target column found. Please select target column manually."})
        warnings.append("Target column could not be automatically determined.")
        
    # 3. Missing values check
    if total_missing == 0:
        checks.append({"name": "Missing Values", "status": "passed", "message": "Zero missing values detected."})
    else:
        checks.append({"name": "Missing Values", "status": "warning", "message": f"Found {total_missing} missing values across dataset. Imputation will be applied."})
        warnings.append(f"Found {total_missing} missing values across features.")
        
    # 4. Duplicate rows check
    if duplicate_rows == 0:
        checks.append({"name": "Duplicate Rows", "status": "passed", "message": "Zero duplicate records found."})
    else:
        checks.append({"name": "Duplicate Rows", "status": "warning", "message": f"Found {duplicate_rows} duplicate rows. They will be handled automatically."})
        warnings.append(f"{duplicate_rows} duplicate rows detected.")
        
    # 5. Single value columns
    if single_value_cols:
        checks.append({"name": "Zero Variance Columns", "status": "warning", "message": f"Columns with only 1 unique value: {single_value_cols}."})
        warnings.append(f"Zero variance columns detected: {', '.join(single_value_cols)}.")
    else:
        checks.append({"name": "Feature Variance", "status": "passed", "message": "All columns contain variable information."})
        
    # 6. ID Columns
    if id_candidates:
        checks.append({"name": "Identifier Columns", "status": "passed", "message": f"Identified ID columns to exclude from training: {id_candidates}."})
        
    is_valid = total_rows > 10 and total_cols >= 2 and len(errors) == 0

    return {
        "is_valid": is_valid,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "duplicate_rows": duplicate_rows,
        "missing_values_total": total_missing,
        "columns_profile": col_profiles,
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "id_columns": id_candidates,
        "detected_target_column": detected_target,
        "detected_target_classes": target_classes,
        "single_value_columns": single_value_cols,
        "high_cardinality_columns": high_cardinality_cols,
        "checks": checks,
        "warnings": warnings,
        "errors": errors
    }


def compute_dataset_statistics(df: pd.DataFrame, target_col: Optional[str] = None) -> Dict[str, Any]:
    """Computes comprehensive numerical & categorical statistics and charts data for the dataset."""
    numerical_stats = {}
    categorical_stats = {}
    
    # Try converting numeric-like string columns
    df_clean = df.copy()
    for col in df_clean.columns:
        if df_clean[col].dtype == object:
            try:
                coerced = pd.to_numeric(df_clean[col].astype(str).str.strip(), errors='coerce')
                if coerced.notna().mean() > 0.8:
                    df_clean[col] = coerced
            except Exception:
                pass
                
    num_cols = df_clean.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df_clean.select_dtypes(exclude=[np.number]).columns.tolist()
    
    for col in num_cols:
        series = df_clean[col].dropna()
        if len(series) > 0:
            numerical_stats[col] = {
                "count": int(len(series)),
                "missing": int(df_clean[col].isna().sum()),
                "mean": round(float(series.mean()), 2),
                "std": round(float(series.std()), 2) if len(series) > 1 else 0.0,
                "median": round(float(series.median()), 2),
                "min": round(float(series.min()), 2),
                "max": round(float(series.max()), 2),
                "q25": round(float(series.quantile(0.25)), 2),
                "q75": round(float(series.quantile(0.75)), 2),
                "skew": round(float(series.skew()), 2) if len(series) > 2 else 0.0
            }
            
    for col in cat_cols:
        series = df_clean[col].dropna()
        if len(series) > 0:
            val_counts = series.value_counts()
            top_val = str(val_counts.index[0]) if len(val_counts) > 0 else "N/A"
            top_freq = int(val_counts.iloc[0]) if len(val_counts) > 0 else 0
            
            categorical_stats[col] = {
                "count": int(len(series)),
                "missing": int(df_clean[col].isna().sum()),
                "unique_count": int(series.nunique()),
                "top_value": top_val,
                "top_frequency": top_freq,
                "frequency_percentage": round((top_freq / len(series)) * 100, 2),
                "unique_values": [str(v) for v in series.unique()[:20]]
            }
            
    # Chart Data Preparation
    charts_data = {}
    
    # 1. Target Distribution (Churn vs Non-Churn)
    if target_col and target_col in df_clean.columns:
        target_counts = df_clean[target_col].dropna().value_counts()
        charts_data["target_distribution"] = [
            {"name": str(k), "count": int(v), "percentage": round(float(v) / len(df_clean) * 100, 1)}
            for k, v in target_counts.items()
        ]
        
        # 2. Key categorical breakdowns vs target
        for col in cat_cols:
            if col != target_col and df_clean[col].nunique() <= 10:
                ct = pd.crosstab(df_clean[col].astype(str), df_clean[target_col].astype(str))
                breakdown = []
                for cat_val, row in ct.iterrows():
                    entry = {"category": str(cat_val)}
                    for tgt_val in ct.columns:
                        entry[str(tgt_val)] = int(row[tgt_val])
                    breakdown.append(entry)
                clean_key = f"breakdown_{col.lower().replace(' ', '_')}"
                charts_data[clean_key] = {
                    "feature": col,
                    "data": breakdown
                }
                
        # 3. Numeric distributions vs target (Histograms / Averages)
        for col in num_cols:
            if col != target_col:
                series = df_clean[col].dropna()
                if len(series) > 10:
                    # Binned histogram
                    bins = 8
                    try:
                        hist, bin_edges = np.histogram(series, bins=bins)
                        hist_data = []
                        for i in range(len(hist)):
                            bin_label = f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}"
                            hist_data.append({
                                "bin": bin_label,
                                "count": int(hist[i])
                            })
                        charts_data[f"hist_{col.lower().replace(' ', '_')}"] = {
                            "feature": col,
                            "data": hist_data
                        }
                    except Exception:
                        pass
                        
    # 4. Correlation matrix for numeric features (up to 8 features)
    if len(num_cols) >= 2:
        sub_num = num_cols[:8]
        corr = df_clean[sub_num].corr().fillna(0).round(2)
        corr_matrix = []
        for r_col in sub_num:
            for c_col in sub_num:
                corr_matrix.append({
                    "x": r_col,
                    "y": c_col,
                    "value": float(corr.loc[r_col, c_col])
                })
        charts_data["correlation"] = {
            "columns": sub_num,
            "data": corr_matrix
        }

    return {
        "numerical_stats": numerical_stats,
        "categorical_stats": categorical_stats,
        "charts_data": charts_data
    }
