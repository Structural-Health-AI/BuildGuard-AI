@echo off
REM Security Status Check Script for BuildGuard-AI
REM This script verifies that security measures are in place

setlocal enabledelayedexpansion

REM Colors (using ANSI escape codes, works in newer Windows 10+)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set RESET=[0m

echo.
echo ========================================
echo Security Status Check - BuildGuard-AI
echo ========================================
echo.

set ISSUES_FOUND=0

REM 1. Check if .env files are in .gitignore
echo 1. Checking .gitignore protection...
git check-ignore backend\.env >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    %GREEN%✓%RESET% backend\.env is in .gitignore
) else (
    echo    %RED%✗%RESET% backend\.env is NOT in .gitignore (CRITICAL!)
    set ISSUES_FOUND=1
)

git check-ignore frontend\.env >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    %GREEN%✓%RESET% frontend\.env is in .gitignore
) else (
    echo    %RED%✗%RESET% frontend\.env is NOT in .gitignore
    set ISSUES_FOUND=1
)

REM 2. Check if pre-commit hook is installed
echo.
echo 2. Checking pre-commit hook...
if exist ".git\hooks\pre-commit" (
    echo    %GREEN%✓%RESET% Pre-commit hook is installed
) else (
    echo    %YELLOW%⚠%RESET% Pre-commit hook is NOT installed
    echo       Run: setup-pre-commit-hook.bat
)

REM 3. Check for .env files existence (they should exist locally)
echo.
echo 3. Checking local environment files...
if exist "backend\.env" (
    echo    %GREEN%✓%RESET% backend\.env exists (local only)
) else (
    echo    %YELLOW%⚠%RESET% backend\.env does not exist
    echo       Copy from .env.example: cp backend\.env.example backend\.env
)

if exist "frontend\.env" (
    echo    %GREEN%✓%RESET% frontend\.env exists (local only)
) else (
    echo    %YELLOW%⚠%RESET% frontend\.env does not exist
    echo       Copy from .env.example: cp frontend\.env.example frontend\.env
)

REM 4. Check if default secrets are still in use
echo.
echo 4. Checking for default secrets...
findstr /M "your-super-secret-key-change-in-production" backend\.env >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    %YELLOW%⚠%RESET% Using default SECRET_KEY (OK for development only)
    echo       For production: Update SECRET_KEY in backend\.env
) else (
    echo    %GREEN%✓%RESET% Using custom SECRET_KEY (not default placeholder)
)

REM 5. Check if example files exist
echo.
echo 5. Checking documentation...
if exist "backend\.env.example" (
    echo    %GREEN%✓%RESET% backend\.env.example exists
) else (
    echo    %RED%✗%RESET% backend\.env.example missing
    set ISSUES_FOUND=1
)

if exist "frontend\.env.example" (
    echo    %GREEN%✓%RESET% frontend\.env.example exists
) else (
    echo    %RED%✗%RESET% frontend\.env.example missing
    set ISSUES_FOUND=1
)

REM 6. Check for security documentation
echo.
echo 6. Checking security documentation...
if exist "SECURITY_AUDIT_SUMMARY.md" (
    echo    %GREEN%✓%RESET% SECURITY_AUDIT_SUMMARY.md
) else (
    echo    %RED%✗%RESET% SECURITY_AUDIT_SUMMARY.md missing
)

if exist "SECRETS_MANAGEMENT_GUIDE.md" (
    echo    %GREEN%✓%RESET% SECRETS_MANAGEMENT_GUIDE.md
) else (
    echo    %RED%✗%RESET% SECRETS_MANAGEMENT_GUIDE.md missing
)

if exist "SECURITY_REMEDIATION_PLAN.md" (
    echo    %GREEN%✓%RESET% SECURITY_REMEDIATION_PLAN.md
) else (
    echo    %RED%✗%RESET% SECURITY_REMEDIATION_PLAN.md missing
)

REM 7. Check git history for exposed secrets (brief)
echo.
echo 7. Checking git history...
git log --all --source --full-history -- backend\.env >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    %RED%✗%RESET% WARNING: backend\.env found in git history!
    echo       This is a CRITICAL security issue. See SECURITY_REMEDIATION_PLAN.md
    set ISSUES_FOUND=1
) else (
    echo    %GREEN%✓%RESET% backend\.env not in git history (good)
)

REM Summary
echo.
echo ========================================
if %ISSUES_FOUND% equ 0 (
    echo %GREEN%✓ All critical security checks passed!%RESET%
    echo.
    echo Remember to:
    echo   1. Keep .env files out of git
    echo   2. Rotate secrets quarterly
    echo   3. Never commit sensitive data
) else (
    echo %RED%✗ Some critical security issues found!%RESET%
    echo.
    echo Fix the issues marked above before deploying.
)
echo ========================================
echo.

exit /b %ISSUES_FOUND%
