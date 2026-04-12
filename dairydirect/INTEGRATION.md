# DairyDirect - Full Stack Integration Guide

## Project Overview

**Tech Stack:**
- **Frontend:** Next.js 16 (React 19) with TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js with Node.js, Supabase SDK
- **Database:** PostgreSQL via Supabase
- **Authentication:** JWT-based

---

## Phase 1: Setup

### 1.1 Environment Variables

**Backend (.env)**
```
PORT=4000
NODE_ENV=development

# Supabase - Get from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### 1.2 Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 1.3 Database Setup

1. Create a Supabase project at supabase.com
2. Go to SQL Editor and run `database/supabase/schema.sql`
3. Run `database/supabase/seed.sql` for sample data
4. Copy credentials to `.env`

---

## Phase 2: Integration

### 2.1 API Contract Map

| Frontend | Backend | Database |
|----------|---------|----------|
| `/store` → `fetchProducts()` | GET `/api/products` | `products` table |
| `/cart` → `checkout()` | POST `/api/orders` | `orders` table |
| `/orders` | GET `/api/orders` | `orders` table |
| `/subscriptions` | GET `/api/subscriptions` | `subscriptions` table |
| Login flow | POST `/api/auth/login` | `users` table |
| Signup flow | POST `/api/auth/signup` | `users` table |

### 2.2 CORS Configuration

Backend already configured in `src/app.js`:
- Allowed origins: localhost:5173, localhost:3000
- Methods: GET, POST, PATCH, DELETE, OPTIONS
- Credentials enabled

### 2.3 Authentication Flow

1. User calls `/api/auth/login` with phone + password
2. Backend validates and returns JWT token
3. Frontend stores token in localStorage
4. All protected requests include `Authorization: Bearer <token>`
5. Backend `authenticate` middleware validates token

---

## Phase 3: Testing Checklist

### 3.1 Backend Tests

```bash
# Start backend
cd backend && npm run dev

# Test endpoints
curl http://localhost:4000/                    # Health check
curl http://localhost:4000/api/products         # Products API
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","password":"test123"}'
```

### 3.2 Frontend Tests

```bash
# Start frontend
cd frontend && npm run dev

# Visit
http://localhost:5173     # Mobile view
http://localhost:5173/store
http://localhost:5173/cart
```

### 3.3 End-to-End Tests

- [ ] Products load from API (fallback to mock data if API fails)
- [ ] Add to cart works
- [ ] Cart persists on page refresh
- [ ] Checkout creates order (mock)
- [ ] Login/signup flow works (with Supabase)

---

## Phase 4: Production Readiness

### 4.1 Security Checklist

- [ ] Replace JWT_SECRET with strong random key
- [ ] Enable rate limiting in production
- [ ] Enable HTTPS
- [ ] Set up proper CORS for production domain
- [ ] Remove debug logging
- [ ] Enable database row-level security (RLS)

### 4.2 Performance Checklist

- [ ] Add database indexes (already in schema)
- [ ] Implement caching for products
- [ ] Add pagination for orders/subscriptions
- [ ] Optimize images (Next.js Image component)

### 4.3 Deployment

**Option 1: Docker**
```bash
docker-compose up --build
```

**Option 2: Manual**
```bash
# Backend
cd backend && npm run build  # if using TypeScript
NODE_ENV=production npm start

# Frontend
cd frontend && npm run build
npm run start
```

---

## Common Integration Issues

### Issue 1: CORS Errors
**Fix:** Ensure `ALLOWED_ORIGINS` includes your frontend port

### Issue 2: 500 Error on Products
**Fix:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct

### Issue 3: Auth Token Invalid
**Fix:** Check JWT_SECRET matches between backend and token generation

### Issue 4: Schema Mismatch
**Fix:** Backend uses `phone` not `email` - ensure frontend sends phone

### Issue 5: Products not loading
**Fix:** Frontend has fallback to mock data - check network tab for errors

---

## Code Corrections Made

1. **order.routes.js** - Connected to actual controller
2. **user.routes.js** - Connected to actual controller  
3. **subscription.routes.js** - Connected to new controller
4. **auth.routes.js** - Connected to actual controller
5. **authController.js** - Changed from email to phone-based auth
6. **subscriptionController.js** - Created new controller

---

## File Structure

```
dairydirect/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, rate limiting
│   │   ├── config/       # Database config
│   │   └── utils/        # Supabase client
│   └── .env              # Environment variables
├── frontend/
│   ├── app/              # Next.js pages
│   ├── lib/              # API client, context
│   ├── components/      # UI components
│   └── .env.local        # Frontend env
├── database/
│   └── supabase/        # SQL schema + seed
└── docker-compose.yml    # Container setup
```

---

## Next Steps

1. Add real Supabase credentials to `.env`
2. Run schema.sql in Supabase SQL Editor
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`
5. Test the full flow