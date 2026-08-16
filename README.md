# Customer Churn Prediction System 🚀
**Full-Stack AI & Data Science Web Application**

A production-grade, full-stack **Customer Churn Prediction and Explainable AI (XAI)** platform built for a B.Tech Artificial Intelligence & Data Science final project.

The application allows users to upload customer datasets from Kaggle, automatically performs data validation and preprocessing, trains and benchmarks multiple Machine Learning algorithms (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting), automatically selects the optimal classifier based on F1-Score & ROC-AUC, and provides explainable single and batch customer predictions with real-time churn probability scoring.

---

## 🌟 Key Features

1. **Authentication & Authorization**:
   - Secure JWT token-based authentication with bcrypt password hashing.
   - User-isolated datasets, models, and prediction history.

2. **Automated Dataset Validation & Profiling**:
   - Accepts any customer CSV dataset downloaded from Kaggle.
   - 1-Click "Load Sample Kaggle Telco Dataset" for instant demo without manual uploads.
   - Automated health checks: Missing value imputation, duplicate handling, high-cardinality detection, zero-variance feature alerts.
   - Heuristic target column detection (supports `Churn`, `Exited`, `CustomerStatus`, `Churn_Value`, etc.) with user override capability.

3. **Exploratory Data Analysis (EDA)**:
   - Full descriptive numerical statistics: Mean, Median, Std Dev, Min, Max, Skewness, Quantiles.
   - Categorical feature breakdown: Cardinality, mode values, frequency percentages.
   - Dynamic charts: Churn vs Non-Churn distribution, contract vs churn, tenure distribution histograms, payment method breakdown.

4. **Machine Learning Pipeline (Scikit-Learn)**:
   - Leak-free `ColumnTransformer` with `SimpleImputer`, `StandardScaler`, and `OneHotEncoder(handle_unknown='ignore')`.
   - Simultaneous training and benchmarking of 4 algorithms:
     1. **Logistic Regression** (baseline calibrated probabilities)
     2. **Decision Tree Classifier** (interpretable rule extraction)
     3. **Random Forest Classifier** (ensemble bagging with feature importances)
     4. **Gradient Boosting Classifier** (sequential error boosting)
   - Evaluates: Accuracy, Precision, Recall, F1-Score, ROC-AUC, Confusion Matrix, and Training Time.
   - Automated selection of the Best Performing model (weighted F1 + ROC-AUC for class imbalance).
   - In-memory Joblib artifact caching for sub-millisecond inference latency.

5. **Customer Churn Prediction & Explainable AI (XAI)**:
   - Dynamic customer form generation based on the active dataset's feature space.
   - Pre-configured test presets ("High-Risk Customer" & "Loyal Customer").
   - Animated SVG radial risk gauge (Low Risk < 35%, Medium Risk 35-65%, High Risk > 65%).
   - Exact Churn Probability % and Retention Probability % from model `predict_proba()`.
   - Explainable AI: Pinpoints top customer risk drivers (e.g. Month-to-month contract, Low tenure, High monthly charges, Lack of tech support).
   - Printable Customer PDF report.

6. **Batch Inference & Export**:
   - Bulk CSV customer classification.
   - Preview results table with color-coded risk tags.
   - Export processed predictions to downloadable CSV.

7. **Prediction History & Audit Log**:
   - Searchable, filterable history table stored in the database.
   - Export all prediction history to CSV.
   - Single-record inspection modal with original input feature payload.

8. **Dual Database Engine (MySQL + SQLite Fallback)**:
   - Configured for MySQL with SQLAlchemy ORM.
   - Automatically initializes `churn_db` database and seamlessly falls back to local SQLite if MySQL credentials are not configured.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS v4, Lucide React Icons, Recharts, Axios |
| **Backend** | Python 3.14+, FastAPI, Pydantic v2, Uvicorn, REST APIs |
| **Machine Learning** | Scikit-learn, Pandas, NumPy, Joblib |
| **Database & ORM** | MySQL 8.0 / SQLite, SQLAlchemy ORM, PyMySQL |
| **Security** | PyJWT, Bcrypt, OAuth2 Password Bearer |

---

## 📂 Project Architecture

```
customer-churn-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # User registration, login, JWT token verification
│   │   │   ├── datasets.py      # CSV upload, profiling, validation, preview, EDA
│   │   │   ├── models.py        # ML training, 4-model comparison, active model selection
│   │   │   ├── predictions.py   # Single prediction, batch prediction, history log, exports
│   │   │   └── dashboard.py     # High-level KPIs, churn rates, chart data feeds
│   │   ├── auth/
│   │   │   └── jwt_handler.py   # Password hashing & JWT generation
│   │   ├── database/
│   │   │   ├── db.py            # MySQL engine & SQLite fallback manager
│   │   │   └── models.py        # User, Dataset, TrainedModel, PredictionRecord models
│   │   ├── ml/
│   │   │   ├── preprocessing.py # Scikit-learn ColumnTransformer pipeline
│   │   │   ├── train.py         # Multi-model training and evaluation engine
│   │   │   ├── evaluate.py      # Accuracy, Precision, Recall, F1, ROC-AUC, CM metrics
│   │   │   ├── predict.py       # Probability inference and XAI explanation logic
│   │   │   └── model_manager.py # Joblib serialization & memory cache
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── utils/
│   │   │   └── data_profiler.py # Automated CSV validation & EDA generator
│   │   └── main.py              # FastAPI entry point with CORS
│   ├── sample_data/             # Pre-packaged 2,000-row Kaggle Telco Churn CSV
│   ├── uploads/                 # Uploaded datasets and batch prediction outputs
│   ├── trained_models/          # Serialized Joblib model artifacts
│   ├── requirements.txt         # Backend Python dependencies
│   ├── test_pipeline.py         # Automated pipeline verification script
│   └── .env                     # Database and JWT configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, MetricCard, RiskGauge, StatusBadge, ConfusionMatrix
│   │   ├── pages/               # Login, Register, Dashboard, Upload, EDA, Training, Comparison, Predict, Batch, History
│   │   ├── services/            # Axios REST API client
│   │   ├── context/             # AuthContext state manager
│   │   ├── App.jsx              # Tab routing & main layout
│   │   └── index.css            # Tailwind design system tokens
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MySQL Server 8.0 (Application automatically falls back to SQLite if MySQL is not running)

---

### 2. Backend Setup & Startup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd customer-churn-app/backend
   ```

2. (Optional) Configure MySQL credentials in `.env` if desired:
   ```env
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DB=churn_db
   SECRET_KEY=your_secret_key_here
   ```

3. Run the automated verification test script:
   ```bash
   python test_pipeline.py
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The interactive Swagger API documentation will be available at: http://localhost:8000/docs*

---

### 3. Frontend Setup & Startup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd customer-churn-app/frontend
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be live at: http://localhost:5173*

---

## 🧪 Verification & User Walkthrough

1. **Sign In**:
   - Access `http://localhost:5173`.
   - Click **"Fill Pre-Configured Demo Account"** or register a new user.
2. **Load Dataset**:
   - Navigate to **"Dataset Upload"**.
   - Click **"Load 1-Click Kaggle Telco Demo Dataset"** or drag-and-drop a custom CSV.
   - Review automated data health validation checklist and preview rows.
3. **Exploratory Data Analysis**:
   - Navigate to **"Data Analytics & EDA"** to view descriptive statistics and feature distributions.
4. **Train Models**:
   - Navigate to **"Model Training"**, select the 4 algorithms, and click **"Train Models Now"**.
   - Observe live training progress and individual execution times.
5. **Compare Models**:
   - Navigate to **"Model Comparison"** to review the metric comparison table, multi-metric bar chart, feature importances, and interactive Confusion Matrix.
6. **Predict Individual Customer**:
   - Navigate to **"Predict Churn"**, choose a preset or customize customer attributes, and click **"Calculate Churn Probability"**.
   - Observe the radial probability gauge, risk level tag, and explainable risk factors.
7. **Batch Predictions**:
   - Navigate to **"Batch Prediction"**, upload a customer CSV, and download the processed results with predicted probabilities.
8. **Prediction History**:
   - Navigate to **"Prediction History"** to audit, search, filter, or export logged inference runs.

---

## 🎓 Academic Project Notes
- Developed for **B.Tech Artificial Intelligence & Data Science**.
- Designed to demonstrate clean architecture, leak-free Scikit-learn pipelines, model benchmarking, Explainable AI (XAI) concepts, and full-stack web engineering.
