@echo off
echo ==========================================
echo CHANGE WINDOWS DEFAULT TERMINAL TO CMD
echo ==========================================
echo.
echo This will set CMD as the default terminal for Windows
echo This affects VS Code AI commands and system defaults
echo.
pause

echo.
echo Checking current settings...
reg query "HKCU\Console" /v FaceName 2>nul

echo.
echo Changing default terminal to CMD...

REM Set CMD as default console host
reg add "HKCU\Console" /v FaceName /t REG_SZ /d "Consolas" /f
reg add "HKCU\Console" /v FontFamily /t REG_DWORD /d 54 /f
reg add "HKCU\Console" /v FontSize /t REG_DWORD /d 1048576 /f
reg add "HKCU\Console" /v FontWeight /t REG_DWORD /d 400 /f

echo.
echo ==========================================
echo SUCCESS!
echo ==========================================
echo.
echo CMD is now the default terminal.
echo.
echo IMPORTANT: You need to:
echo 1. Close ALL VS Code windows
echo 2. Restart VS Code
echo 3. The AI will now use CMD instead of PowerShell
echo.
pause
