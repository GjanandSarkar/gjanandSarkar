#!/bin/bash
# Development setup script

echo "🚀 Setting up DairyDirect development environment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend setup complete"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend setup complete"

cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env files:"
echo "   - Backend: Copy backend/.env.example to backend/.env"
echo "   - Add your Supabase credentials"
echo ""
echo "2. Setup database:"
echo "   - Go to Supabase dashboard"
echo "   - Run schema.sql from database/supabase/schema.sql"
echo "   - Run seed.sql from database/supabase/seed.sql"
echo ""
echo "3. Start development:"
echo "   npm run dev"
echo ""
echo "🎉 Happy coding!"
