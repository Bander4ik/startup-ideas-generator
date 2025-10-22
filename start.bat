@echo off
echo Starting Startup Ideas Generator...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5174
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend Server" cmd /k "cd /d %~dp0 && node server/index.js"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd /d %~dp0\client && npm run dev"

echo.
echo Servers are starting...
echo Wait 5 seconds and open: http://localhost:5174
echo.
pause
