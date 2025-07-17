@echo off
echo Starting SafeSpace FastAPI Server...
echo.
echo Health check: http://localhost:8000/health
echo Test endpoint: http://localhost:8000/test
echo API docs: http://localhost:8000/docs
echo.

cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Install requirements if needed
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing/updating requirements...
pip install -r requirements.txt

echo Starting FastAPI server...
python run.py

pause
