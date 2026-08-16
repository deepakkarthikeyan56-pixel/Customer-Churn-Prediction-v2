import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    models = relationship("TrainedModel", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="user", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    rows_count = Column(Integer, nullable=False, default=0)
    columns_count = Column(Integer, nullable=False, default=0)
    target_column = Column(String(100), nullable=True)
    target_classes = Column(JSON, nullable=True)
    feature_meta = Column(JSON, nullable=True)  # Categorical, numerical, id columns, unique values
    validation_status = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="datasets")
    models = relationship("TrainedModel", back_populates="dataset", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="dataset", cascade="all, delete-orphan")


class TrainedModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    algorithm_name = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=False, default=0.0)
    precision = Column(Float, nullable=False, default=0.0)
    recall = Column(Float, nullable=False, default=0.0)
    f1_score = Column(Float, nullable=False, default=0.0)
    roc_auc = Column(Float, nullable=False, default=0.0)
    confusion_matrix = Column(JSON, nullable=True)
    feature_importances = Column(JSON, nullable=True)
    training_time = Column(Float, nullable=False, default=0.0)  # in seconds
    model_path = Column(String(500), nullable=False)
    is_best = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="models")
    dataset = relationship("Dataset", back_populates="models")
    predictions = relationship("PredictionRecord", back_populates="model", cascade="all, delete-orphan")


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    customer_identifier = Column(String(100), nullable=True)
    input_data = Column(JSON, nullable=False)
    prediction = Column(String(50), nullable=False)  # 'Churn' or 'No Churn' (or '1' / '0')
    churn_probability = Column(Float, nullable=False, default=0.0)  # in percent (e.g. 82.4)
    retention_probability = Column(Float, nullable=False, default=0.0)  # in percent (e.g. 17.6)
    risk_level = Column(String(20), nullable=False, default="Low")  # 'Low', 'Medium', 'High'
    top_factors = Column(JSON, nullable=True)  # List of contributing risk explanations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="predictions")
    dataset = relationship("Dataset", back_populates="predictions")
    model = relationship("TrainedModel", back_populates="predictions")
