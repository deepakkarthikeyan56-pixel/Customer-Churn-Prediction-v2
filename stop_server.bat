@echo off
echo Stopping Customer Churn Background Server on Port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a 2>nul
)
echo Server stopped successfully.
pause
