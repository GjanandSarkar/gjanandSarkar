#!/bin/bash
# ============================================================
# DairyDirect (Gjanand Sarkar) — Linux/macOS Setup Script
# ============================================================

set -e

echo "🥛 Setting up DairyDirect Full-Stack Environment..."

# 1. Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# 2. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend setup complete"

# 3. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend setup complete"

cd ..

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📋 Next Steps to Start:"
echo "   - Run development environment (Frontend + Backend concurrently):"
echo "       npm run dev"
echo ""
echo "   - Or run separately:"
echo "       npm run dev:backend   (Port 4000)"
echo "       npm run dev:frontend  (Port 3000)"
echo ""
echo "   - Run backend tests:"
echo "       npm run test"
echo ""
echo "🎉 Happy Coding!"
