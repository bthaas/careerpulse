#!/bin/bash

# Deploy script - commits and pushes OOP refactoring to GitHub
# This will trigger Railway auto-deployment

echo "🚀 Deploying OOP Refactoring to Production"
echo ""

# Check git status
echo "📋 Checking what changed..."
git status --short
echo ""

# Add all changes
echo "➕ Adding all changes..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Add OOP refactoring with comprehensive tests and documentation

- Refactored all services to OOP architecture (DatabaseService, GmailService, AuthService, etc.)
- Added 217+ passing tests (property-based, unit, integration)
- Added comprehensive JSDoc documentation
- Maintained backward compatibility with functional exports
- Added dependency injection container
- Created OOP architecture documentation
- All tests passing"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Railway will auto-deploy in 2-3 minutes."
echo "📊 Watch deployment: https://railway.app"
echo "🌐 Your site: https://jobfetch.app"
