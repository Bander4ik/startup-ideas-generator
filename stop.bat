@echo off
echo Stopping all Node.js processes...

taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo Servers stopped successfully!
) else (
    echo No servers were running.
)

echo.
pause
