#!/bin/bash

# AURABOT Setup Script
# This script will help you set up the bot for the first time

set -e

echo "🤖 AURABOT Setup Script"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js >= 16.x from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version is too old!${NC}"
    echo "Please upgrade to Node.js >= 16.x"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"
echo ""

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) found${NC}"
echo ""

# Check git
echo "📦 Checking git..."
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  git is not installed (optional)${NC}"
else
    echo -e "${GREEN}✅ git $(git --version | cut -d' ' -f3) found${NC}"
fi
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules already exists, skipping...${NC}"
    echo "Run 'npm install' manually if you want to update dependencies"
fi
echo ""

# Setup config.json
echo "⚙️  Setting up config.json..."
if [ ! -f "config.json" ]; then
    if [ -f "config.example.json" ]; then
        cp config.example.json config.json
        echo -e "${GREEN}✅ Created config.json from config.example.json${NC}"
        echo -e "${YELLOW}⚠️  Please edit config.json and add your API keys and owner ID${NC}"
    else
        echo -e "${RED}❌ config.example.json not found!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  config.json already exists, skipping...${NC}"
fi
echo ""

# Setup git skip-worktree for config.json
if command -v git &> /dev/null; then
    echo "🔒 Setting up git to protect config.json..."
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # Check if file is tracked
        if git ls-files --error-unmatch config.json > /dev/null 2>&1; then
            git update-index --skip-worktree config.json 2>/dev/null || true
            echo -e "${GREEN}✅ Git will now ignore changes to config.json${NC}"
        else
            echo -e "${YELLOW}⚠️  config.json is not tracked by git, skipping...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Not a git repository, skipping...${NC}"
    fi
    echo ""
fi

# Check appstate.json
echo "🔐 Checking appstate.json..."
if [ ! -f "appstate.json" ]; then
    echo -e "${YELLOW}⚠️  appstate.json not found${NC}"
    echo "This file will be created when you first run the bot"
else
    echo -e "${GREEN}✅ appstate.json found${NC}"
fi
echo ""

# Final instructions
echo "========================"
echo -e "${GREEN}✅ Setup completed!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Edit config.json and add:"
echo "   - Your API key in 'externalApi.key'"
echo "   - Your owner ID in 'permissions.owner'"
echo "   - Any other configuration you need"
echo ""
echo "2. Run the bot:"
echo "   npm run dev    # Development mode with hot reload"
echo "   npm start      # Production mode"
echo ""
echo "3. On first run, you'll need to login to Facebook"
echo "   The bot will create appstate.json automatically"
echo ""
echo "🔒 Your config.json is protected from git commits"
echo "   (API keys won't be committed to repository)"
echo ""
