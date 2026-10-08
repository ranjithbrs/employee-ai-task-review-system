@echo off
echo ======================================================================
echo  MentorAI: Continuous Internship Task Review & Follow-up System
echo ======================================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "MentorAI Backend" cmd /k ".\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo Starting React Frontend on http://127.0.0.1:3000 ...
start "MentorAI Frontend" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 3000"

echo.
echo Both services are launching!
echo App URL: http://127.0.0.1:3000
echo Backend Docs: http://127.0.0.1:8000/docs
echo.
pause
