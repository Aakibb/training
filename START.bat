@echo off
echo.
echo ========================================
echo Training Management System
echo ========================================
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
  echo Installing dependencies... (This is required only once)
  call npm install
  echo.
)

REM Start the server
echo Starting the application...
echo.
echo Open your browser and go to:
echo http://localhost:3000
echo.
echo Admin Panel:    http://localhost:3000/admin.html
echo Learner:        http://localhost:3000/learner.html
echo Analytics:      http://localhost:3000/analytics.html
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause
