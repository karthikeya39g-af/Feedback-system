@echo off
echo Starting Feedback System...

:: Start Backend
start "Feedback Backend" cmd /k "cd server && node index.js"

:: Start Frontend
start "Feedback Frontend" cmd /k "npm run dev"

echo Servers starting...
echo Backend: http://localhost:5002
echo Frontend: http://localhost:5173 (standard Vite port)
