@echo off
echo ==========================================
echo PUSH SAFARNAMA TO GITHUB
echo ==========================================
echo.
echo Pushing to: https://github.com/devKiNGCRiC/SafarNama
echo.

REM Configure repository
git remote add origin https://github.com/devKiNGCRiC/SafarNama.git
git branch -M main
git push -u origin main

echo.
echo ==========================================
echo PUSH COMPLETE!
echo ==========================================
pause
