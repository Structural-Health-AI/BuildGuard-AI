@echo off
REM Setup Security Pre-Commit Hook (Windows)
REM This script installs the pre-commit hook to prevent accidental secrets commits

setlocal enabledelayedexpansion

REM Get repo root
for /f %%i in ('git rev-parse --show-toplevel') do set REPO_ROOT=%%i

set HOOKS_DIR=%REPO_ROOT%\.git\hooks
set HOOK_FILE=%HOOKS_DIR%\pre-commit

echo.
echo ========================================
echo Setup Security Pre-Commit Hook
echo ========================================
echo.

REM Create hooks directory if it doesn't exist
if not exist "%HOOKS_DIR%" (
    mkdir "%HOOKS_DIR%"
    echo Created hooks directory: %HOOKS_DIR%
)

REM Copy pre-commit hook
if exist "%REPO_ROOT%\pre-commit-hook.bat" (
    copy "%REPO_ROOT%\pre-commit-hook.bat" "%HOOK_FILE%"
    echo Installed pre-commit hook: %HOOK_FILE%
) else (
    echo ERROR: pre-commit-hook.bat not found
    exit /b 1
)

REM Verify installation
if exist "%HOOK_FILE%" (
    echo.
    echo SUCCESS: Pre-commit hook installed!
    echo.
    echo The hook will:
    echo   - Prevent committing .env files
    echo   - Check for hardcoded secrets
    echo   - Validate Python syntax
    echo   - Block commits with sensitive data
    echo.
) else (
    echo ERROR: Failed to install pre-commit hook
    exit /b 1
)

echo ========================================
echo.
