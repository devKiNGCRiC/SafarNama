@echo off
echo ==========================================
echo SAFARNAMA - QUICK START
echo ==========================================
echo.
echo Choose an option:
echo.
echo 1. Start Both (Client + Server)
echo 2. Start Server Only
echo 3. Start Client Only
echo 4. Install Dependencies
echo 5. Check Status
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto both
if "%choice%"=="2" goto server
if "%choice%"=="3" goto client
if "%choice%"=="4" goto install
if "%choice%"=="5" goto status
if "%choice%"=="6" goto end

:both
echo.
echo Starting both Client and Server...
start cmd /k "cd Server && npm start"
timeout /t 3
start cmd /k "cd client && npm run dev"
goto end

:server
echo.
echo Starting Server...
cd Server
npm start
goto end

:client
echo.
echo Starting Client...
cd client
npm run dev
goto end

:install
echo.
echo Installing all dependencies...
echo.
echo [1/3] Installing root dependencies...
call npm install
echo.
echo [2/3] Installing server dependencies...
cd Server
call npm install
cd ..
echo.
echo [3/3] Installing client dependencies...
cd client
call npm install
cd ..
echo.
echo ✅ All dependencies installed!
pause
goto end

:status
echo.
echo ==========================================
echo SYSTEM STATUS
echo ==========================================
echo.
echo Node Version:
node --version
echo.
echo npm Version:
npm --version
echo.
echo Server Dependencies:
cd Server
call npm list --depth=0
cd ..
echo.
echo Client Dependencies:
cd client
call npm list --depth=0
cd ..
echo.
pause
goto end

:end
echo.
echo Goodbye!
timeout /t 2
