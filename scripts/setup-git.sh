#!/bin/bash

# Script to setup git to ignore changes to config.json
# This allows you to keep your API keys local without committing them

echo "Setting up git to ignore changes to config.json..."

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "Error: config.json not found!"
    echo "Please create config.json from config.example.json first."
    exit 1
fi

# Tell git to skip worktree for config.json
git update-index --skip-worktree config.json

if [ $? -eq 0 ]; then
    echo "✅ Success! Git will now ignore changes to config.json"
    echo "Your API keys will not be committed to the repository."
    echo ""
    echo "To undo this, run:"
    echo "  git update-index --no-skip-worktree config.json"
else
    echo "❌ Error: Failed to set skip-worktree"
    exit 1
fi
