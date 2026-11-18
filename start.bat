@echo off
title QuantumShield Platform Launcher
echo ======================================================================
echo QuantumShield: Classical and Post-Quantum Cryptography Evaluation Platform
echo ======================================================================
echo.

set PATH=C:\Program Files\nodejs;%PATH%

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "QuantumShield Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak > nul

echo [2/2] Starting React Frontend on http://localhost:5173 ...
start "QuantumShield Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================================
echo QuantumShield is initializing!
echo   - Backend API: http://localhost:8000
echo   - Interactive API Docs: http://localhost:8000/docs
echo   - Research Web Dashboard: http://localhost:5173
echo ======================================================================
echo.
pause
