@echo off
REM Script to setup git to ignore changes to config.json
REM This allows you to keep your API keys local without committing them

echo Setting up git to ignore changes to config.json...

REM Check if config.json exists
if not exist "config.json" (
    echo Error: config.json not found!
    echo Please create config.json from config.example.json first.
    exit /b 1
)

REM Tell git to skip worktree for config.json
git update-index --skip-worktree config.json

if %errorlevel% equ 0 (
    echo ✅ Success! Git will now ignore changes to config.json
    echo Your API keys will not be committed to the repository.
    echo.
    echo To undo this, run:
    echo   git update-index --no-skip-worktree config.json
) else (
    echo ❌ Error: Failed to set skip-worktree
    exit /b 1
)
