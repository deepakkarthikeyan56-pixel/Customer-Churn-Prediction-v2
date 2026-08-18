import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

class ChurnPreprocessor:
    def __init__(self, target_column: str, id_columns: Optional[List[str]] = None):
        self.target_column = target_column
        self.id_columns = id_columns or []
        self.numerical_cols: List[str] = []
        self.categorical_cols: List[str] = []
        self.feature_columns: List[str] = []
        self.preprocessor_pipeline: Optional[ColumnTransformer] = None
        self.target_mapping: Dict[Any, int] = {}
        self.inverse_target_mapping: Dict[int, str] = {}
        self.onehot_feature_names: List[str] = []
        self.categorical_unique_values: Dict[str, List[str]] = {}
        self.numerical_ranges: Dict[str, Dict[str, float]] = {}

    def _prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df_clean = df.copy()
        
        # Remove duplicates
        df_clean = df_clean.drop_duplicates()
        
        # Drop ID columns
        cols_to_drop = [col for col in self.id_columns if col in df_clean.columns]
        if cols_to_drop:
            df_clean = df_clean.drop(columns=cols_to_drop)
            
        # Clean numeric columns that might have whitespace strings or object dtype
        for col in df_clean.columns:
            if col != self.target_column and df_clean[col].dtype == object:
                try:
                    coerced = pd.to_numeric(df_clean[col].astype(str).str.strip(), errors='coerce')
                    if coerced.notna().mean() > 0.8:
                        df_clean[col] = coerced
                except Exception:
                    pass
                    
        return df_clean

    def _map_target(self, y_raw: pd.Series) -> pd.Series:
        """Converts raw target column to binary 0 and 1."""
        unique_vals = y_raw.dropna().unique().tolist()
        
        # Determine positive class (Churn = 1)
        positive_patterns = ["yes", "1", "true", "churn", "exited", "churned", "positive", "y"]
        
        pos_val = None
        neg_val = None
        for val in unique_vals:
            str_val = str(val).strip().lower()
            if str_val in positive_patterns:
                pos_val = val
            else:
                neg_val = val
                
        if pos_val is None and len(unique_vals) == 2:
            neg_val = unique_vals[0]
            pos_val = unique_vals[1]
        elif pos_val is None:
            pos_val = unique_vals[0]
            neg_val = unique_vals[1] if len(unique_vals) > 1 else unique_vals[0]

        self.target_mapping = {neg_val: 0, pos_val: 1}
        self.inverse_target_mapping = {0: str(neg_val), 1: str(pos_val)}
        
        y_mapped = y_raw.map(lambda x: self.target_mapping.get(x, 0)).astype(int)
        return y_mapped

    def fit_transform_dataset(
        self, 
        df: pd.DataFrame, 
        test_size: float = 0.20, 
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Dict[str, Any]]:
        """Fits preprocessing pipeline and splits data into train/test sets."""
        df_clean = self._prepare_dataframe(df)
        
        if self.target_column not in df_clean.columns:
            raise ValueError(f"Target column '{self.target_column}' not found in dataset.")
            
        y_raw = df_clean[self.target_column]
        y = self._map_target(y_raw)
        
        X = df_clean.drop(columns=[self.target_column])
        self.feature_columns = list(X.columns)
        
        # Segregate numeric and categorical columns
        self.numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
        
        # Ensure all categoricals are consistently strings
        for col in self.categorical_cols:
            X[col] = X[col].astype(str).str.strip()
            self.categorical_unique_values[col] = [
                str(v) for v in X[col].dropna().unique().tolist()
            ]
            
        for col in self.numerical_cols:
            series = X[col].dropna()
            self.numerical_ranges[col] = {
                "min": float(series.min()) if len(series) > 0 else 0.0,
                "max": float(series.max()) if len(series) > 0 else 100.0,
                "mean": float(series.mean()) if len(series) > 0 else 50.0,
                "median": float(series.median()) if len(series) > 0 else 50.0
            }

        # Build Scikit-learn ColumnTransformer
        transformers = []
        
        if self.numerical_cols:
            num_pipeline = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', num_pipeline, self.numerical_cols))
            
        if self.categorical_cols:
            cat_pipeline = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', cat_pipeline, self.categorical_cols))
            
        self.preprocessor_pipeline = ColumnTransformer(
            transformers=transformers,
            remainder='drop'
        )
        
        # Stratified Train-test split
        try:
            X_train_df, X_test_df, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )
        except Exception:
            # Fallback to non-stratified if single class edge case
            X_train_df, X_test_df, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )

        # Fit preprocessor strictly on training data to avoid data leakage
        X_train_trans = self.preprocessor_pipeline.fit_transform(X_train_df)
        X_test_trans = self.preprocessor_pipeline.transform(X_test_df)
        
        # Extract transformed feature names
        feature_names = []
        if self.numerical_cols:
            feature_names.extend(self.numerical_cols)
        if self.categorical_cols:
            ohe = self.preprocessor_pipeline.named_transformers_['cat'].named_steps['onehot']
            ohe_names = ohe.get_feature_names_out(self.categorical_cols)
            feature_names.extend(list(ohe_names))
            
        self.onehot_feature_names = feature_names
        
        metadata = {
            "feature_columns": self.feature_columns,
            "numerical_cols": self.numerical_cols,
            "categorical_cols": self.categorical_cols,
            "categorical_unique_values": self.categorical_unique_values,
            "numerical_ranges": self.numerical_ranges,
            "target_mapping": self.target_mapping,
            "inverse_target_mapping": self.inverse_target_mapping,
            "transformed_feature_names": self.onehot_feature_names
        }
        
        return X_train_trans, X_test_trans, y_train.values, y_test.values, metadata

    def transform_single_input(self, input_dict: Dict[str, Any]) -> np.ndarray:
        """Transforms a single customer input dictionary into preprocessed feature array with robust type casting."""
        clean_input = {}
        
        # Auto-compute TotalCharges if not provided or 0
        mc = float(input_dict.get('MonthlyCharges', 0) or 0)
        ten = float(input_dict.get('tenure', 0) or 0)
        if 'TotalCharges' not in input_dict or not input_dict.get('TotalCharges'):
            input_dict['TotalCharges'] = round(mc * max(ten, 1), 2)
            
        # Match case-insensitive keys
        input_lower_map = {str(k).strip().lower(): v for k, v in input_dict.items()}
        
        for col in self.feature_columns:
            col_l = col.strip().lower()
            val = input_dict.get(col) if col in input_dict else input_lower_map.get(col_l)
            
            if col in self.numerical_cols:
                try:
                    num_val = float(val) if val is not None and str(val).strip() != '' else self.numerical_ranges.get(col, {}).get("median", 0.0)
                except Exception:
                    num_val = self.numerical_ranges.get(col, {}).get("median", 0.0)
                clean_input[col] = num_val
            else:
                # Categorical
                if val is not None and str(val).strip() != '':
                    str_val = str(val).strip()
                    # Try exact match or case-insensitive match from unique categories
                    avail = self.categorical_unique_values.get(col, [])
                    matched = next((a for a in avail if a.lower() == str_val.lower()), str_val)
                    clean_input[col] = matched
                else:
                    clean_input[col] = self.categorical_unique_values.get(col, ["Unknown"])[0]

        df_input = pd.DataFrame([clean_input])[self.feature_columns]
        
        # Explicit type coercion
        for col in self.numerical_cols:
            df_input[col] = pd.to_numeric(df_input[col], errors='coerce').fillna(self.numerical_ranges.get(col, {}).get("median", 0.0))
        for col in self.categorical_cols:
            df_input[col] = df_input[col].astype(str)
            
        return self.preprocessor_pipeline.transform(df_input)

    def transform_batch(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """Transforms a batch DataFrame for bulk prediction."""
        df_clean = df.copy()
        cols_to_drop = [col for col in self.id_columns if col in df_clean.columns]
        if self.target_column in df_clean.columns:
            cols_to_drop.append(self.target_column)
            
        df_features = df_clean.drop(columns=cols_to_drop, errors='ignore')
        
        for col in self.feature_columns:
            if col not in df_features.columns:
                if col in self.numerical_cols:
                    df_features[col] = self.numerical_ranges.get(col, {}).get("median", 0.0)
                else:
                    df_features[col] = self.categorical_unique_values.get(col, ["Unknown"])[0]
                    
        for col in self.numerical_cols:
            df_features[col] = pd.to_numeric(df_features[col], errors='coerce').fillna(self.numerical_ranges.get(col, {}).get("median", 0.0))
        for col in self.categorical_cols:
            df_features[col] = df_features[col].astype(str).str.strip()
                
        df_ordered = df_features[self.feature_columns]
        return self.preprocessor_pipeline.transform(df_ordered), df_clean
