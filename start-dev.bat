@echo off
set "ROOT=%~dp0"
echo Starte Familio Dev-Server...

start "Backend (FastAPI)" cmd /k "cd /d "%ROOT%backend" && uvicorn app.main:app --reload"

start "WebApp (Vite)" cmd /k "cd /d "%ROOT%webapp" && npm run dev"

echo Beide Server gestartet.
echo   Backend:  http://localhost:8000
echo   WebApp:   http://localhost:3000
