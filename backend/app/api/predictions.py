import os
import uuid
import datetime
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
import io

from app.database.db import get_db
from app.database.models import PredictionRecord, TrainedModel, Dataset, User
from app.schemas.prediction import (
    SinglePredictionRequest, SinglePredictionResponse,
    BatchPredictionResponse, PredictionHistoryItem, RiskFactor
)
from app.auth.jwt_handler import get_current_user
from app.ml.predict import predict_single_customer, predict_batch_customers

router = APIRouter(prefix="/api/predictions", tags=["Predictions & Inference"])

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(OUTPUT_DIR, exist_ok=True)

@router.post("/predict", response_model=SinglePredictionResponse)
def predict_single(
    payload: SinglePredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine model to use
    if payload.model_id:
        model = db.query(TrainedModel).filter(
            TrainedModel.id == payload.model_id, 
            TrainedModel.user_id == current_user.id
        ).first()
    else:
        model = db.query(TrainedModel).filter(
            TrainedModel.user_id == current_user.id,
            TrainedModel.is_active == True
        ).first()
        if not model:
            model = db.query(TrainedModel).filter(
                TrainedModel.user_id == current_user.id
            ).order_by(TrainedModel.f1_score.desc()).first()

    if not model or not os.path.exists(model.model_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained machine learning model found. Please train models first before predicting."
        )

    # Generate prediction
    try:
        res = predict_single_customer(
            model_path=model.model_path,
            input_data=payload.features
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

    # Save to database
    cust_id = payload.customer_identifier or f"CUST-{uuid.uuid4().hex[:6].upper()}"
    pred_record = PredictionRecord(
        user_id=current_user.id,
        dataset_id=model.dataset_id,
        model_id=model.id,
        customer_identifier=cust_id,
        input_data=payload.features,
        prediction=res["prediction"],
        churn_probability=res["churn_probability"],
        retention_probability=res["retention_probability"],
        risk_level=res["risk_level"],
        top_factors=res["top_factors"]
    )
    db.add(pred_record)
    db.commit()
    db.refresh(pred_record)

    top_factors_obj = [
        RiskFactor(
            feature=tf["feature"],
            value=tf["value"],
            impact=tf["impact"],
            importance=tf["importance"]
        ) for tf in res["top_factors"]
    ]

    return SinglePredictionResponse(
        prediction_id=pred_record.id,
        model_id=model.id,
        algorithm_name=model.algorithm_name,
        customer_identifier=cust_id,
        prediction=res["prediction"],
        prediction_raw=res["prediction_raw"],
        churn_probability=res["churn_probability"],
        retention_probability=res["retention_probability"],
        risk_level=res["risk_level"],
        top_factors=top_factors_obj,
        input_data=payload.features,
        created_at=pred_record.created_at
    )


@router.post("/batch", response_model=BatchPredictionResponse)
async def batch_predict(
    file: UploadFile = File(...),
    model_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch prediction requires a CSV file (.csv)."
        )

    # Select model
    if model_id:
        model = db.query(TrainedModel).filter(
            TrainedModel.id == model_id, 
            TrainedModel.user_id == current_user.id
        ).first()
    else:
        model = db.query(TrainedModel).filter(
            TrainedModel.user_id == current_user.id,
            TrainedModel.is_active == True
        ).first()

    if not model or not os.path.exists(model.model_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model found. Please train models first."
        )

    # Read batch CSV
    try:
        df_batch = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse batch CSV: {str(e)}")

    if df_batch.empty:
        raise HTTPException(status_code=400, detail="Batch CSV file is empty.")

    out_filename = f"batch_prediction_{uuid.uuid4().hex[:8]}.csv"
    out_filepath = os.path.join(OUTPUT_DIR, out_filename)

    res = predict_batch_customers(
        model_path=model.model_path,
        df_batch=df_batch,
        output_csv_path=out_filepath
    )

    return BatchPredictionResponse(
        model_id=model.id,
        algorithm_name=model.algorithm_name,
        total_records=res["total_records"],
        churn_count=res["churn_count"],
        non_churn_count=res["non_churn_count"],
        high_risk_count=res["high_risk_count"],
        medium_risk_count=res["medium_risk_count"],
        low_risk_count=res["low_risk_count"],
        results_preview=res["results_preview"],
        download_url=f"/api/predictions/download-batch/{out_filename}"
    )


@router.get("/download-batch/{filename}")
def download_batch_results(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Requested file not found")
    return FileResponse(filepath, filename=filename, media_type="text/csv")


@router.get("/history", response_model=List[PredictionHistoryItem])
def get_prediction_history(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    prediction: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord).filter(PredictionRecord.user_id == current_user.id)

    if search:
        query = query.filter(PredictionRecord.customer_identifier.ilike(f"%{search}%"))
    if risk_level:
        query = query.filter(PredictionRecord.risk_level == risk_level)
    if prediction:
        query = query.filter(PredictionRecord.prediction == prediction)

    records = query.order_by(desc(PredictionRecord.created_at)).offset(offset).limit(limit).all()

    results = []
    for r in records:
        model_name = r.model.algorithm_name if r.model else "Classifier"
        results.append(PredictionHistoryItem(
            id=r.id,
            customer_identifier=r.customer_identifier,
            model_name=model_name,
            prediction=r.prediction,
            churn_probability=r.churn_probability,
            retention_probability=r.retention_probability,
            risk_level=r.risk_level,
            input_data=r.input_data,
            top_factors=r.top_factors,
            created_at=r.created_at
        ))

    return results


@router.delete("/history/{prediction_id}")
def delete_prediction_record(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(PredictionRecord).filter(
        PredictionRecord.id == prediction_id,
        PredictionRecord.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    db.delete(record)
    db.commit()
    return {"message": "Prediction record deleted"}


@router.delete("/history/clear-all")
def clear_all_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(PredictionRecord).filter(PredictionRecord.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All prediction history cleared"}


@router.get("/export-csv")
def export_prediction_history_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == current_user.id
    ).order_by(desc(PredictionRecord.created_at)).all()

    if not records:
        raise HTTPException(status_code=404, detail="No prediction records to export.")

    data = []
    for r in records:
        row = {
            "ID": r.id,
            "Customer_Identifier": r.customer_identifier,
            "Model": r.model.algorithm_name if r.model else "N/A",
            "Prediction": r.prediction,
            "Churn_Probability_%": r.churn_probability,
            "Retention_Probability_%": r.retention_probability,
            "Risk_Level": r.risk_level,
            "Date": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        # Flatten input data
        if isinstance(r.input_data, dict):
            for k, v in r.input_data.items():
                row[f"Feature_{k}"] = v
        data.append(row)

    df_export = pd.DataFrame(data)
    stream = io.StringIO()
    df_export.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=churn_predictions_export.csv"
    return response
