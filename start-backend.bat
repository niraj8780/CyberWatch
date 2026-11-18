@echo off
echo ============================================
echo   CyberWatch Backend Starting...
echo ============================================

cd /d "%~dp0backend"

echo [1/3] Activating Python virtual environment...
call venv\Scripts\activate.bat

echo [2/3] Installing/updating dependencies...
pip install -r requirements.txt --quiet

echo [3/3] Starting FastAPI server on port 8000...
echo.
echo Backend will be available at: http://localhost:8000
echo API docs available at:        http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
