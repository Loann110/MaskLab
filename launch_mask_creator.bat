
@echo off
setlocal
cd /d "%~dp0"

echo ===============================================
echo   Local SAM3 Mask Creator
echo ===============================================
echo.

set HF_HUB_OFFLINE=1
set TRANSFORMERS_OFFLINE=1
set HF_DATASETS_OFFLINE=1
set HF_HUB_DISABLE_TELEMETRY=1

python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not found. Install Python 3.10+ or add it to PATH.
    pause
    exit /b 1
)

echo Checking Python dependencies...
python -c "import fastapi, uvicorn, PIL, numpy, torch" >nul 2>&1
if errorlevel 1 (
    echo.
    echo Some dependencies are missing.
    echo Installing lightweight web dependencies from requirements.txt...
    echo NOTE: torch is NOT installed automatically because CUDA/CPU versions depend on your PC.
    python -m pip install -r requirements.txt
)

echo.
echo Starting interface...
echo If the browser does not open, go to: http://127.0.0.1:7860
echo.
python app.py

pause
