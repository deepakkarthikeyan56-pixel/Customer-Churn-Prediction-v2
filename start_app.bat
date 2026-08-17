@echo off
title Customer Churn Prediction System
echo ===================================================
echo Starting Customer Churn Prediction Web Application
echo ===================================================
cd /d "%~dp0\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
