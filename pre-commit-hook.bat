@echo off
REM Pre-commit hook to prevent committing secrets (Windows version)
REM Place this file in .git\hooks\pre-commit (no file extension)

setlocal enabledelayedexpansion

REM Get repo root
for /f %%i in ('git rev-parse --show-toplevel') do set REPO_ROOT=%%i

set ERRORS_FOUND=0

echo.
echo Checking for secrets and sensitive files...
echo ======================================

REM 1. Check for .env files being staged
echo.
echo Checking for .env files...
git diff --cached --name-only | findstr /R "\.env secrets.json credentials.json" >nul
if not errorlevel 1 (
    echo ERROR: .env or secrets file detected in staging area!
    echo.
    echo These should NOT be committed to git.
    echo Remove them from staging with: git reset HEAD ^<filename^>
    set ERRORS_FOUND=1
)

REM 2. Check for dangerous patterns in staged code
echo.
echo Checking for hardcoded secrets...

for /f "tokens=*" %%A in ('git diff --cached ^| findstr /I "password SECRET_KEY api_key apikey access_token private_key"') do (
    echo WARNING: Potential secret found:
    echo   %%A
    set ERRORS_FOUND=1
)

REM 3. Check for Python syntax errors
echo.
echo Checking Python files for syntax errors...
for /f "tokens=*" %%A in ('git diff --cached --name-only --diff-filter=ACM ^| findstr "\.py$"') do (
    if exist "%REPO_ROOT%\%%A" (
        python -m py_compile "%REPO_ROOT%\%%A" 2>nul
        if errorlevel 1 (
            echo ERROR: Python syntax error in: %%A
            set ERRORS_FOUND=1
        )
    )
)

REM Report results
echo.
echo ======================================
if %ERRORS_FOUND% equ 0 (
    echo All security checks passed!
    exit /b 0
) else (
    echo Security checks failed. Commit blocked.
    echo Fix the issues above before committing.
    exit /b 1
)
