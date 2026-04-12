# DairyDirect Backend API

A Node.js/Express API for the DairyDirect e-commerce platform. Provides authentication, product management, orders, and subscription services.

## Setup

### Prerequisites

- Node.js v16+
- Supabase account
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update with your credentials:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_JWT_SECRET` - JWT secret from Supabase
- `JWT_SECRET` - Your custom JWT secret
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)

## Running the Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID

### Users

- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile

### Orders

- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Subscriptions

- `GET /api/subscriptions` - Get subscriptions
- `POST /api/subscriptions` - Create subscription

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app
│   ├── controllers/        # Business logic
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── middlewares/       # Custom middleware
│   ├── validators/        # Input validators
│   ├── utils/             # Utilities
│   └── config/            # Configuration
├── index.js               # Server entry point
└── package.json
```

## Documentation

API documentation: See `docs/DairyDirect_API.postman_collection.json`

## Testing

```bash
npm test
```

## License

MIT
