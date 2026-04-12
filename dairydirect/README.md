# DairyDirect - Full-Stack E-commerce Platform

A complete e-commerce platform for premium dairy products with user authentication, product management, subscriptions, and order tracking.

## 🚀 Features

- **User Authentication**: Secure signup/login with JWT
- **Product Catalog**: Browse and search dairy products
- **Shopping Cart & Orders**: Create and manage orders
- **Subscriptions**: Recurring delivery subscriptions
- **User Dashboard**: Profile management and order history
- **Admin Panel**: Manage products and orders
- **Payment Integration**: (Ready for Stripe)
- **Responsive Design**: Mobile-first UI

## 📁 Project Structure

```
dairydirect/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Data models
│   │   ├── routes/        # API endpoints
│   │   ├── middlewares/   # Auth, errors, rate limiting
│   │   ├── validators/    # Input validation
│   │   ├── config/        # Configuration
│   │   └── utils/         # Utilities
│   └── package.json
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   ├── hooks/        # Custom React hooks
│   │   ├── config/       # Configuration
│   │   └── App.jsx
│   └── package.json
├── database/         # Database scripts
│   └── supabase/
│       ├── schema.sql    # Database schema
│       └── seed.sql      # Sample data
└── docs/            # API documentation
    └── DairyDirect_API.postman_collection.json
```

## 🛠️ Tech Stack

**Backend:**

- Node.js + Express
- PostgreSQL (via Supabase)
- JWT Authentication
- Helmet (Security)
- CORS

**Frontend:**

- React 18
- Vite
- React Router
- Axios
- CSS3

**Database:**

- Supabase (PostgreSQL)

## 📋 Prerequisites

- Node.js v16+
- npm or yarn
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dairydirect
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Database Setup

- Create a Supabase project
- Run the schema.sql and seed.sql scripts in Supabase SQL editor

### 5. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## 📚 API Documentation

See `docs/DairyDirect_API.postman_collection.json` for complete API endpoints.

### Key Endpoints:

**Authentication**

- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/refresh

**Products**

- GET /api/products
- GET /api/products/:id

**Orders**

- POST /api/orders
- GET /api/orders
- GET /api/orders/:id

**User**

- GET /api/users/profile
- PATCH /api/users/profile

## 🔐 Environment Variables

See `.env.example` files in backend and frontend folders.

## 📖 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📝 License

MIT License

## 👥 Contributors

Your Name

## 📧 Support

For support, email support@dairydirect.com

---

**Last Updated**: April 12, 2026
