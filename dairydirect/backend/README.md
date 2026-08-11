# 🥛 DairyDirect (Gjanand Sarkar) — Production Express & TypeScript Backend

A high-performance, modular, and production-ready REST API backend for the DairyDirect farm-fresh A2 dairy marketplace and subscription platform.

---

## 🏗️ Architecture Overview

```text
Frontend (Next.js 16 App Router / Client API)
        │
        ▼ (Port 4000 / 3000)
Express.js REST API
 ├── Security: Helmet, CORS, Sliding-Window Rate Limiting, Request ID
 ├── Authentication: Phone OTP, Google OAuth Sync, JWT (Access + Refresh)
 ├── Authorization: Strict Role-Based Access Control (RBAC: customer, seller, admin)
 ├── Validation: Zod input parsing on body, params, and queries
 ├── Controllers & Services: Multi-tiered business logic (Pricing Guardian, ACID concurrency)
 └── Repositories: Parameterized PostgreSQL Queries + Supabase Client fallback
        │
        ▼
PostgreSQL Database (Supabase / AWS RDS)
```

---

## 📦 Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (ES2022)
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (via `pg` Connection Pool) + Supabase JS Client
- **Security & Auth**: `jsonwebtoken`, `bcryptjs`, `crypto` (Timing-safe HMAC), `helmet`, `cors`
- **Validation**: `zod`
- **Payment Gateway**: `razorpay` (Webhook & signature verification)
- **Tooling**: `tsx`, `typescript`

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoint Catalog

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/send-otp` | No | Send 6-digit numeric OTP to phone |
| POST | `/api/auth/verify-otp` | No | Verify OTP, generate user & issue JWT |
| POST | `/api/auth/sync` | No | Synchronize Google OAuth / Supabase user |
| GET/POST | `/api/auth/session` | Yes | Get currently authenticated session user |
| GET | `/api/auth/profile` | Yes | Fetch user profile data |
| PUT | `/api/auth/profile` | Yes | Update name, phone, email, avatar, UPI |
| POST | `/api/auth/logout` | No | End session |

### 📍 Addresses (`/api/addresses`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/addresses` | Yes | List saved user addresses |
| POST | `/api/addresses` | Yes | Save new address (handles single default) |
| PUT | `/api/addresses/:id` | Yes | Update address |
| DELETE | `/api/addresses/:id` | Yes | Soft delete address |

### 🛒 Products & Catalog (`/api/products`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | No | List products (supports category, brand, deals, search, pagination) |
| GET | `/api/products/:id` | No | Get product details with variants & reviews |
| POST | `/api/products` | Seller/Admin | Create product with variants & profit guard check |
| PUT | `/api/products/:id` | Seller/Admin | Update product details |
| DELETE | `/api/products/:id` | Admin | Soft/permanent delete product |

### 🛍️ Cart (`/api/cart`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/cart` | Yes | Get current user's cart |
| POST | `/api/cart` | Yes | Add item to cart |
| PUT | `/api/cart` | Yes | Update cart item quantity |
| DELETE | `/api/cart` | Yes | Remove item from cart |
| POST | `/api/cart/clear` | Yes | Clear cart |

### 📦 Orders & Checkout (`/api/orders`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/orders` | Yes | List customer orders or admin orders |
| POST | `/api/orders/place` | Yes | Atomically place order (locks stock, applies coupon, awards points) |
| GET | `/api/orders/:id` | Yes | Detailed order receipt with items |
| PUT | `/api/orders/:id` | Admin/Seller | Update order status and payment status |

### 💳 Payments (`/api/payments`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/create-order` | Yes | Create Razorpay order |
| POST | `/api/verify-payment` | Yes | Verify HMAC-SHA256 signature and mark order paid |
| POST | `/api/payments/webhook` | No | Razorpay webhook event listener |

### 🥛 Subscriptions (`/api/subscriptions`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/subscriptions` | Yes | Get user subscriptions or all (admin) |
| POST | `/api/subscriptions` | Yes | Create daily/alternate/weekly delivery plan |
| PUT | `/api/subscriptions` | Yes | Pause, resume, modify volume, or cancel |

### 🎟️ Coupons (`/api/coupons`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/coupons/validate` | Yes | Check coupon discount against margin guard |
| GET | `/api/coupons` | Admin | List all coupons |
| POST | `/api/coupons` | Admin | Create discount coupon |
| PUT | `/api/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/coupons/:id` | Admin | Delete coupon |

### 🛡️ Freshness Guarantee Returns (`/api/admin/returns`, `/api/returns`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/returns` | Yes | List freshness guarantee return requests |
| POST | `/api/admin/returns` | Yes | Submit return claim with reason & photos |
| PUT | `/api/admin/returns/:id` | Admin | Approve/reject/refund return claim |

### 🏪 Multi-Vendor Marketplace (`/api/sellers`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/sellers` | No | List active vendor stores or store by slug |
| POST | `/api/sellers` | Yes | Create seller profile |
| GET | `/api/sellers/inquiries` | Yes | Get vendor inquiries |
| POST | `/api/sellers/inquiries` | No | Submit "Become a Seller" application |
| PATCH | `/api/sellers/inquiries` | Admin | Approve or reject vendor inquiry |

### 📊 Admin Suite (`/api/admin`)
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Executive BI metrics (MRR, AOV, Revenue) |
| GET | `/api/admin/reports` | Admin | Aggregated sales reports + CSV export |
| GET | `/api/admin/inventory` | Admin | Inventory matrix & stock status alerts |
| PUT | `/api/admin/inventory` | Admin | Batch update stock, cost price, and batches |
| GET | `/api/admin/customers` | Admin | Customer management & loyalty points |
| GET | `/api/admin/settings` | Admin | Platform business settings |
| PUT | `/api/admin/settings` | Admin | Update delivery fees, free thresholds, margins |
| GET/POST/PUT/DELETE | `/api/admin/delivery-slots` | Admin | Delivery time slots management |

---

## 🔒 Security Features

1. **SQL Injection Prevention**: 100% Parameterized queries across all database repositories.
2. **Cryptographic Signatures**: Razorpay payment verification uses `crypto.timingSafeEqual` in constant time.
3. **Profit-Margin Safeguard**: Dynamic calculation against unit cost prices prevents negative margins.
4. **Row-Level Inventory Lock**: Concurrency-safe transactions using `SELECT FOR UPDATE` prevents overselling.
5. **Role-Based Access Control (RBAC)**: Fine-grained middleware verifying `admin`, `seller`, and `customer` permissions independently.
6. **IDOR Protection**: All user resource queries enforce `user_id = req.user.userId`.
7. **Rate Limiting**: Sliding-window rate limiters prevent brute-force attacks on authentication and APIs.
