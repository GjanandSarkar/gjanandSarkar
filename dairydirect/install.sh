#!/bin/bash
# Combined installation script for DairyDirect

echo "🚀 Installing DairyDirect..."

# Install backend
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with Supabase credentials"
echo "2. Run: npm run dev-backend (in backend folder)"
echo "3. Run: npm run dev-frontend (in frontend folder)"
