@echo off
REM AURABOT Setup Script for Windows
REM This script will help you set up the bot for the first time

echo 🤖 AURABOT Setup Script
echo ========================
echo.

REM Check Node.js
echo 📦 Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js ^>= 16.x from https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Check npm
echo 📦 Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed!
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found
echo.

REM Check git
echo 📦 Checking git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  git is not installed (optional)
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo ✅ %GIT_VERSION% found
)
echo.

REM Install dependencies
echo 📥 Installing dependencies...
if not exist "node_modules" (
    call npm install
    echo ✅ Dependencies installed
) else (
    echo ⚠️  node_modules already exists, skipping...
    echo Run 'npm install' manually if you want to update dependencies
)
echo.

REM Setup config.json
echo ⚙️  Setting up config.json...
if not exist "config.json" (
    if exist "config.example.json" (
        copy config.example.json config.json >nul
        echo ✅ Created config.json from config.example.json
        echo ⚠️  Please edit config.json and add your API keys and owner ID
    ) else (
        echo ❌ config.example.json not found!
        exit /b 1
    )
) else (
    echo ⚠️  config.json already exists, skipping...
)
echo.

REM Setup git skip-worktree for config.json
where git >nul 2>&1
if %errorlevel% equ 0 (
    echo 🔒 Setting up git to protect config.json...
    git rev-parse --git-dir >nul 2>&1
    if %errorlevel% equ 0 (
        git ls-files --error-unmatch config.json >nul 2>&1
        if %errorlevel% equ 0 (
            git update-index --skip-worktree config.json >nul 2>&1
            if %errorlevel% equ 0 (
                echo ✅ Git will now ignore changes to config.json
            )
        ) else (
            echo ⚠️  config.json is not tracked by git, skipping...
        )
    ) else (
        echo ⚠️  Not a git repository, skipping...
    )
    echo.
)

REM Check appstate.json
echo 🔐 Checking appstate.json...
if not exist "appstate.json" (
    echo ⚠️  appstate.json not found
    echo This file will be created when you first run the bot
) else (
    echo ✅ appstate.json found
)
echo.

REM Final instructions
echo ========================
echo ✅ Setup completed!
echo.
echo 📝 Next steps:
echo 1. Edit config.json and add:
echo    - Your API key in 'externalApi.key'
echo    - Your owner ID in 'permissions.owner'
echo    - Any other configuration you need
echo.
echo 2. Run the bot:
echo    npm run dev    # Development mode with hot reload
echo    npm start      # Production mode
echo.
echo 3. On first run, you'll need to login to Facebook
echo    The bot will create appstate.json automatically
echo.
echo 🔒 Your config.json is protected from git commits
echo    (API keys won't be committed to repository)
echo.

pause
