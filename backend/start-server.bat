@echo off
title TimeSlice Backend Server

echo ============================================
echo      TimeSlice Backend Server Startup
echo ============================================
echo.

echo Checking MongoDB status...
sc query "MongoDB" | find "RUNNING"
if errorlevel 1 (
    echo Starting MongoDB service...
    net start MongoDB
    if errorlevel 1 (
        echo ERROR: Failed to start MongoDB service
        echo Please install MongoDB or start it manually
        pause
        exit /b 1
    )
) else (
    echo MongoDB is already running
)

echo.
echo Starting Backend Server...
echo.

cd /d "%~dp0"
npm run dev

pause