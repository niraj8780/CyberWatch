@echo off
echo ============================================
echo   CyberWatch Frontend Starting...
echo ============================================

cd /d "%~dp0frontend"

echo [1/2] Installing/updating Node dependencies...
cmd /c "npm install"

echo [2/2] Starting Vite dev server...
echo.
echo Frontend will be available at: http://localhost:5173
echo.
cmd /c "npm run dev"
pause
