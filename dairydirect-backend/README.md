# 🥛 DairyDirect Backend

A hyper-local dairy e-commerce platform backend built with **Node.js, Express, and Supabase**. Manage daily milk subscriptions, one-time product orders, real-time delivery tracking, and secure user authentication.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Node Version](https://img.shields.io/badge/Node-v24.14.1-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

- **🔐 Authentication**
  - OTP-based login via SMS/Email
  - JWT token authentication & refresh tokens
  - Phone-based user identification
  
- **📦 Product Management**
  - Product catalog with variants (sizes, quantities)
  - Active/inactive product toggling
  - Category-based filtering (Milk, Paneer, Ghee, Buttermilk)
  - Stock management per variant

- **🔁 Subscription System**
  - Daily, weekly, monthly subscription frequencies
  - Subscribe/pause/cancel operations
  - Automatic order generation for active subscriptions
  - Subscription lifecycle management

- **🛒 Order Management**
  - Single-time orders
  - Subscription-based recurring orders
  - Order status tracking (Pending → Confirmed → Out for Delivery → Delivered)
  - Order history and details retrieval

- **📍 Delivery Tracking**
  - Real-time delivery location updates (latitude/longitude)
  - OTP-protected delivery confirmation
  - Delivery agent coordination

- **💳 Payment Management**
  - Payment status tracking
  - Multiple payment modes support
  - Mock payment mode for development

- **🧾 Reporting & Disputes**
  - Customer issue reporting (spoiled, wrong quantity, late delivery, etc.)
  - Issue status tracking (Open, In Review, Resolved, Dismissed)
  - Admin review and resolution

- **👥 Role-Based Access Control (RBAC)**
  - CUSTOMER role: Browse products, place orders, manage subscriptions
  - ADMIN role: Manage products, update order status, handle reports

- **🛡️ Security**
  - CORS protection with configurable origins
  - Rate limiting (general & auth endpoints)
  - Helmet for security headers
  - Input validation with Zod schemas
  - JWT-based protected routes

- **📝 Logging**
  - Winston logger for structured logging
  - Configurable log levels (error, warn, info, debug)
  - Error tracking and debugging

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js v24.14.1 |
| **Framework** | Express.js 4.19.2 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | JWT + Supabase Auth |
| **Validation** | Zod 3.23.0 |
| **Security** | Helmet, Express Rate Limit |
| **Scheduling** | node-cron 3.0.3 |
| **Password Hashing** | bcryptjs 2.4.3 |
| **CORS** | cors 2.8.5 |
| **Logging** | Winston 3.13.0 |
| **Env Management** | dotenv 16.4.5 |
| **Dev Tools** | nodemon 3.1.0, cross-env 7.0.3 |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **npm** (v10 or higher) - comes with Node.js
- **Supabase Account** - [Sign up free](https://supabase.com)
- **Git** - for version control
- **A code editor** - VS Code recommended

### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to your users)
3. Note your **Project URL** and **API Keys** (found in Settings → API)
4. Run the database schema (see [Database Schema](#-database-schema) section)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dairy-ecommerce-platform.git
cd dairy-ecommerce-platform/dairydirect-backend/dairydirect/server
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages from `package.json`:
- Express.js framework
- Supabase client library
- Authentication libraries
- Security & validation tools
- Development tools (nodemon, cross-env)

### 3. Create Environment File

```bash
# Copy the example env file
cp .env.example .env

# Now edit .env with your actual values
# See Configuration section below
```

### 4. Initialize Database

1. Open [Supabase SQL Editor](https://app.supabase.com/project/_/sql)
2. Copy the contents of `server/supabase/schema.sql`
3. Paste into SQL Editor and execute
4. Optionally, run `server/supabase/seed.sql` to add sample data

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev        # Linux/Mac
npm run dev:win    # Windows

# Production mode
npm start
```

Expected output:
```
✅ Supabase connected successfully!
🚀 Server running on http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# ========== SUPABASE ==========
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ========== SERVER ==========
PORT=3000
NODE_ENV=development     # development | production

# ========== CORS ==========
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# ========== LOGGING ==========
LOG_LEVEL=info          # error | warn | info | debug

# ========== SMS/OTP (OPTIONAL) ==========
# MSG91_API_KEY=your_msg91_key_here
# MSG91_TEMPLATE_ID=your_template_id_here
```

### Key Configuration Details

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | API Gateway endpoint | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Public key for client-side auth | JWT token |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (bypasses RLS) | JWT token |
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `ALLOWED_ORIGINS` | Frontend origin whitelist | `http://localhost:5173` |
| `LOG_LEVEL` | Logging verbosity | `info` (default) |

### Getting Supabase Keys

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📂 Project Structure

```
server/
├── index.js                    # App entry point (env loading, server startup)
├── src/
│   ├── app.js                 # Express app configuration & middleware setup
│   │
│   ├── config/
│   │   └── supabase.js        # Supabase client initialization
│   │
│   ├── controllers/            # Route handlers & business logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── subscription.controller.js
│   │   ├── report.controller.js
│   │   └── admin.controller.js
│   │
│   ├── routes/                # API route definitions
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── subscription.routes.js
│   │   ├── report.routes.js
│   │   └── admin.routes.js
│   │
│   ├── middlewares/           # Express middleware
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── rbac.middleware.js    # Role-based access control
│   │   ├── validate.middleware.js # Request validation
│   │   ├── errorHandler.js       # Global error handling
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── services/              # Business logic & DB queries
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── product.service.js
│   │   ├── order.service.js
│   │   ├── subscription.service.js
│   │   ├── subscription.cron.js  # Cron jobs for subscriptions
│   │   ├── report.service.js
│   │   └── admin.service.js
│   │
│   ├── validators/            # Zod validation schemas
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── product.validator.js
│   │   ├── order.validator.js
│   │   ├── subscription.validator.js
│   │   └── report.validator.js
│   │
│   └── utils/                 # Utility functions
│       ├── supabase.js        # Supabase client instances
│       ├── jwt.util.js        # JWT operations
│       ├── otp.util.js        # OTP generation
│       ├── ApiError.js        # Custom error class
│       ├── response.util.js   # Response formatting
│       └── logger.js          # Winston logger setup
│
├── supabase/
│   ├── schema.sql            # Database schema (run once)
│   └── seed.sql              # Sample data (optional)
│
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies & scripts
└── package-lock.json         # Lock file for reproducible installs
```

### Architecture Pattern

```
Request → Middleware (Auth, Validation, Rate Limit)
       → Route Handler
       → Controller (Req/Res handling)
       → Service (Business logic)
       → Supabase/Database
       → Response → Client
```

---

## 🔌 API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "code": 200
}
```

### Health Check

Verify the server is running:

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "DairyDirect API",
    "version": "1.0.0",
    "status": "operational",
    "timestamp": "2026-04-12T08:13:50.244Z",
    "environment": "development"
  }
}
```

### Test Database Connection

Check if Supabase is properly configured:

```http
GET /test-db
```

---

## 🔐 Authentication Endpoints

### Send OTP

Request OTP for phone-based login.

```http
POST /auth/otp/send
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresInMinutes": 5
  }
}
```

**Status Codes:**
- `200` - OTP sent successfully
- `400` - Invalid phone number
- `500` - Server error

### Verify OTP

Verify OTP and receive JWT token.

```http
POST /auth/otp/verify
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "user": {
      "id": "user_9876543210",
      "phone": "9876543210",
      "name": "John Doe",
      "role": "CUSTOMER"
    }
  }
}
```

---

## 📦 Product Endpoints

### List All Products

```http
GET /products
```

**Query Parameters:**
- `category` (optional) - Filter by category: `MILK`, `PANEER`, `GHEE`, `BUTTERMILK`
- `page` (optional) - Pagination page number
- `limit` (optional) - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Toned Milk",
      "category": "MILK",
      "description": "Fresh toned milk",
      "imageUrl": "https://...",
      "isActive": true,
      "variants": [
        {
          "id": "var_123",
          "label": "1 Liter",
          "price": 45.00,
          "stock": 100,
          "isActive": true
        }
      ]
    }
  ]
}
```

### Get Single Product

```http
GET /products/:id
```

### Create Product (ADMIN only)

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Full Cream Milk",
  "category": "MILK",
  "description": "Rich full cream milk",
  "imageUrl": "https://...",
  "variants": [
    {
      "label": "1 Liter",
      "price": 55.00,
      "stock": 100
    }
  ]
}
```

### Toggle Product Status (ADMIN only)

```http
PATCH /products/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}
```

---

## 🛒 Order Endpoints

### Create Order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "addressId": "addr_123",
  "items": [
    {
      "variantId": "var_123",
      "quantity": 2
    }
  ],
  "paymentMode": "ONLINE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "userId": "user_456",
    "status": "PENDING",
    "totalAmount": 90.00,
    "paymentStatus": "PENDING",
    "items": [ ],
    "createdAt": "2026-04-12T10:00:00Z"
  }
}
```

### Get My Orders

```http
GET /orders
Authorization: Bearer <token>
```

### Get Order Details

```http
GET /orders/:id
Authorization: Bearer <token>
```

### Update Order Status (ADMIN only)

```http
PATCH /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Valid Status Transitions:**
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `OUT_FOR_DELIVERY`
- `OUT_FOR_DELIVERY` → `DELIVERED`
- Any status → `CANCELLED`

---

## 🔁 Subscription Endpoints

### Create Subscription

```http
POST /subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "variantId": "var_123",
  "quantity": 1,
  "frequency": "DAILY",
  "startDate": "2026-04-15T00:00:00Z",
  "addressId": "addr_123"
}
```

**Valid Frequencies:**
- `DAILY` - Every day
- `WEEKLY` - Weekly
- `MONTHLY` - Monthly

### Get My Subscriptions

```http
GET /subscriptions
Authorization: Bearer <token>
```

### Get Subscription Details

```http
GET /subscriptions/:id
Authorization: Bearer <token>
```

### Update Subscription

```http
PATCH /subscriptions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2,
  "frequency": "WEEKLY",
  "status": "PAUSED"
}
```

**Valid Statuses:**
- `ACTIVE` - Currently active
- `PAUSED` - Temporarily paused
- `CANCELLED` - Cancelled

---

## 👤 User Endpoints

### Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

### Update Profile

```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Add Address

```http
POST /users/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Home",
  "street": "123 Main St",
  "area": "Downtown",
  "city": "Ahmedabad",
  "pincode": "380001",
  "lat": 23.0225,
  "lng": 72.5714,
  "isDefault": true
}
```

### Get My Addresses

```http
GET /users/addresses
Authorization: Bearer <token>
```

### Set Default Address

```http
PATCH /users/addresses/:id/default
Authorization: Bearer <token>
```

---

## 🧾 Report Endpoints

### Create Report

```http
POST /reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_123",
  "issueType": "SPOILED",
  "description": "Milk was spoiled upon delivery",
  "evidenceUrl": "https://..."
}
```

**Valid Issue Types:**
- `SPOILED` - Product was spoiled
- `WRONG_QUANTITY` - Incorrect quantity delivered
- `WRONG_PRODUCT` - Wrong product delivered
- `LATE_DELIVERY` - Late delivery
- `OTHER` - Other issues

### Get My Reports

```http
GET /reports
Authorization: Bearer <token>
```

### Get Report Details

```http
GET /reports/:id
Authorization: Bearer <token>
```

### Update Report Status (ADMIN only)

```http
PATCH /reports/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "RESOLVED",
  "resolution": "Refund processed"
}
```

**Valid Statuses:**
- `OPEN` - Newly created
- `IN_REVIEW` - Being reviewed
- `RESOLVED` - Issue resolved
- `DISMISSED` - Claim dismissed

---

## 🗄️ Database Schema

The database is managed through Supabase PostgreSQL with the following main tables:

### Users
```sql
- id (UUID, Primary Key)
- phone (String, Unique) - 10-digit Indian phone
- supabase_id (UUID) - Linked to Supabase Auth
- name (String) - User's display name
- role (ENUM: CUSTOMER, ADMIN)
- created_at, updated_at (Timestamps)
```

### Products
```sql
- id (UUID, Primary Key)
- name (String)
- category (ENUM: MILK, PANEER, GHEE, BUTTERMILK)
- description (Text)
- image_url (String)
- is_active (Boolean, default: true)
- variants (One-to-Many: Product Variants)
```

### Product Variants
```sql
- id (UUID, Primary Key)
- product_id (Foreign Key → Products)
- label (String) - e.g., "1 Liter", "500ml"
- price (Decimal)
- stock (Integer)
- is_active (Boolean)
```

### Subscriptions
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key → Users)
- variant_id (Foreign Key → Product Variants)
- quantity (Integer)
- frequency (ENUM: DAILY, WEEKLY, MONTHLY)
- start_date, end_date (Timestamps)
- status (ENUM: ACTIVE, PAUSED, CANCELLED, EXPIRED)
```

### Orders
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key → Users)
- address_id (Foreign Key → Addresses)
- subscription_id (Optional, Foreign Key → Subscriptions)
- type (ENUM: SINGLE, SUBSCRIPTION)
- status (ENUM: PENDING, CONFIRMED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- total_amount (Decimal)
- payment_mode, payment_status (String)
- delivery_otp (String - 6 digits)
- delivery_lat, delivery_lng (Float)
```

### Addresses
```sql
- id (UUID, Primary Key)
- user_id (Foreign Key → Users)
- label (String) - e.g., "Home", "Work"
- street, area, city (String)
- pincode (String)
- lat, lng (Float) - GPS coordinates
- is_default (Boolean)
```

### Reports
```sql
- id (UUID, Primary Key)
- order_id (Foreign Key → Orders)
- user_id (Foreign Key → Users)
- issue_type (ENUM: SPOILED, WRONG_QUANTITY, WRONG_PRODUCT, LATE_DELIVERY, OTHER)
- description (Text)
- status (ENUM: OPEN, IN_REVIEW, RESOLVED, DISMISSED)
- evidence_url (String)
```

---

## 🔧 Development

### Development Mode

Run the server with auto-reload on file changes:

```bash
# Linux/Mac
npm run dev

# Windows
npm run dev:win
```

The server watches for changes in the `src/` directory and automatically restarts.

### Common Development Tasks

#### Add a New Route

1. Create a controller in `src/controllers/`
2. Create route handlers
3. Create a route file in `src/routes/`
4. Register routes in `src/app.js`
5. (Optional) Create validators in `src/validators/`

Example:

```javascript
// src/routes/example.routes.js
import { Router } from 'express';
import { getExamples, createExample } from '../controllers/example.controller.js';

const router = Router();
router.get('/', getExamples);
router.post('/', createExample);
export default router;

// src/app.js
app.use('/examples', exampleRoutes);
```

#### Add Validation

Use Zod schemas in `src/validators/`:

```javascript
import { z } from 'zod';

export const createExampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});
```

#### Logging

Use the Winston logger:

```javascript
import { logger } from '../utils/logger.js';

logger.info('User created', { userId: '123' });
logger.warn('Low stock alert', { productId: '456' });
logger.error('Database error', { error: err.message });
```

### Database Migrations

For schema changes:

1. Update `supabase/schema.sql`
2. Run via Supabase SQL Editor
3. Document the change in commit message

**Note:** This project uses direct SQL instead of ORM/migration tools for simplicity.

---

## 🚀 Deployment

### Deploy to Linux Server

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone repository:**
   ```bash
   git clone <repo-url>
   cd dairy-ecommerce-platform/dairydirect-backend/dairydirect/server
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   nano .env
   # Paste your production environment variables
   ```

4. **Start with PM2 (recommended):**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "dairydirect-api"
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx reverse proxy:**
   ```nginx
   server {
      listen 80;
      server_name api.dairydirect.com;
      
      location / {
         proxy_pass http://localhost:3000;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
      }
   }
   ```

6. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.dairydirect.com
   ```

### Deploy to Cloud (Heroku/Render/Railway)

1. **Create `Procfile`:**
   ```
   web: node index.js
   ```

2. **Set environment variables in cloud dashboard**

3. **Deploy:**
   ```bash
   git push origin main  # For connected deployments
   ```

### Environment for Production

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<production-key>
ALLOWED_ORIGINS=https://dairydirect.com,https://www.dairydirect.com
LOG_LEVEL=warn
```

---

## 🐛 Troubleshooting

### Error: "supabaseUrl is required"

**Problem:** SUPABASE_URL is missing from `.env`

**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in the actual Supabase URL from your project settings
3. Restart the server

```bash
cp .env.example .env
nano .env  # Edit with your real values
npm start
```

### Error: "EADDRINUSE: address already in use :::3000"

**Problem:** Port 3000 is already in use

**Solution:**
```bash
# On Windows PowerShell
$listenPid = (Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -First 1 -ExpandProperty OwningProcess)
if ($listenPid) { Stop-Process -Id $listenPid -Force }
npm start

# On Linux/Mac
lsof -i :3000
kill -9 <PID>
npm start

# Or use a different port
PORT=3001 npm start
```

### Error: "Authentication failed" on requests

**Problem:** JWT token is invalid or missing

**Solution:**
1. Verify token is passed in Authorization header
2. Check token hasn't expired
3. Refresh token using `/auth/otp/verify` endpoint

```http
Authorization: Bearer <your-valid-token>
```

### Database Connection Fails

**Problem:** Cannot connect to Supabase

**Checklist:**
1. Is Supabase project active? Check dashboard
2. Are credentials correct? Copy from Settings → API
3. Is network allowing outbound HTTPS? Check firewall
4. Is Supabase quota exceeded? Check billing

**Debug:**
```bash
# Test endpoint
GET /test-db
```

### No logs appearing

**Problem:** Logger not configured correctly

**Solution:**
1. Check LOG_LEVEL in `.env` (default: `info`)
2. Ensure Winston logger is imported
3. Verify logging calls use correct method: `logger.info()`, `logger.warn()`, etc.

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [JWT Authentication](https://jwt.io/)
- [Zod Validation](https://zod.dev/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use **ESM** modules (no CommonJS)
- Use **camelCase** for variables/functions
- Use **PascalCase** for classes/components
- Add JSDoc comments for complex functions
- Keep functions focused and small
- Write meaningful commit messages

### Testing

```bash
# (Testing setup coming soon)
npm test
```

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions:
- Open an **Issue** on GitHub
- Check **Discussions** for help from the community
- Email: support@dairydirect.com

---

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Analytics dashboard
- [ ] Admin mobile app
- [ ] Multi-language support
- [ ] Automated testing suite
- [ ] GraphQL API option

---

**Made with ❤️ by the DairyDirect Team**
