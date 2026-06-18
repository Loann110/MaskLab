
@echo off
setlocal
cd /d "%~dp0"

echo Installing lightweight dependencies...
python -m pip install -r requirements.txt

echo.
echo Done.
echo Important: install PyTorch separately if not already installed.
echo https://pytorch.org/get-started/locally/
pause
