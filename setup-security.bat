@echo off
echo ====================================================================
echo SAFARNAMA SECURITY SETUP SCRIPT
echo ====================================================================
echo.
echo This script will:
echo 1. Install security packages
echo 2. Generate a strong JWT secret
echo 3. Provide instructions for securing your credentials
echo.
pause

echo.
echo [1/3] Installing security packages...
echo.
cd Server
call npm install helmet express-rate-limit express-mongo-sanitize hpp xss-clean

echo.
echo ====================================================================
echo [2/3] Generating strong JWT secret...
echo.
echo Copy the following JWT secret to your Server/.env file:
echo JWT_SECRET_KEY=
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
echo.
echo ====================================================================

echo.
echo [3/3] SECURITY CHECKLIST
echo.
echo CRITICAL ACTIONS REQUIRED:
echo [ ] 1. Replace JWT_SECRET_KEY in Server/.env with the generated value above
echo [ ] 2. NEVER commit .env files to GitHub
echo [ ] 3. Check if .env was committed: git log --all --full-history -- "*/.env"
echo [ ] 4. If exposed, IMMEDIATELY rotate all credentials:
echo         - MongoDB password (Atlas dashboard)
echo         - Email app password (Google Account)
echo         - Cloudinary API keys (Cloudinary dashboard)
echo [ ] 5. Verify .gitignore includes:
echo         .env
echo         *.env
echo         Server/.env
echo         client/.env
echo.
echo ====================================================================
echo IMPORTANT: Read SECURITY_AUDIT_REPORT.md for detailed information
echo ====================================================================
echo.
pause

echo.
echo Security packages installed successfully!
echo.
echo Next steps:
echo 1. Update your .env file with the new JWT secret
echo 2. Restart your development server
echo 3. Test authentication flow
echo.
pause
