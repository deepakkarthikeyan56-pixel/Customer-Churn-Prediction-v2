import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database.db import init_db, db_type
from app.api.auth import router as auth_router
from app.api.datasets import router as datasets_router
from app.api.models import router as models_router
from app.api.predictions import router as predictions_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="Customer Churn Prediction System API",
    description="Full-stack AI & Data Science Web Application for Customer Churn Analytics and Machine Learning Inference",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(datasets_router)
app.include_router(models_router)
app.include_router(predictions_router)
app.include_router(dashboard_router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": db_type
    }

# Serve React Frontend Static Files (Single Unified Server)
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
ASSETS_DIR = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend_app(full_path: str):
    # If API route requested but not found, return 404 JSON instead of HTML
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
        
    file_path = os.path.join(FRONTEND_DIST, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
        
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
        
    return {
        "status": "online",
        "message": "FastAPI ML Backend is active. Frontend build not detected in frontend/dist.",
        "docs_url": "/docs"
    }
