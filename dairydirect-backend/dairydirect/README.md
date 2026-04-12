# 🥛 DairyDirect Backend

DairyDirect is a hyper-local dairy e-commerce platform backend built to manage daily milk subscriptions, one-time product orders, and real-time delivery tracking.

---

## 🚀 Features

* 🔐 User Authentication (Login / Register)
* 📦 Product Management (Milk, Paneer, Ghee, etc.)
* 🔁 Subscription System (Daily milk delivery)
* 🛒 Order Management (One-time & recurring orders)
* 📍 Delivery Tracking (Real-time updates)
* 💳 Payment Integration (Status handling)
* 🧾 Order History & Reports
* 🛡️ Secure API with proper validation

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* Supabase (Backend as a Service)
* PostgreSQL (used internally by Supabase)
* REST API

---

## 🗄️ Database

This project uses **PostgreSQL** as the primary database, managed through Supabase.

Supabase provides:

* Hosted PostgreSQL database
* Authentication system
* Auto-generated APIs
* Secure data access

All application data such as users, products, orders, subscriptions, and payments are stored in PostgreSQL tables.

---

## 📂 Project Structure

dairydirect-backend/
│
├── 📄 README.md
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .env
├── 📄 .gitignore
│
├── 🚀 server/
│   ├── 📄 index.js              # Entry point of the app
│   ├── 📄 app.js                # Express app configuration
│   │
│   ├── ⚙️ config/
│   │   ├── db.js               # Supabase/PostgreSQL connection
│   │   ├── env.js              # Environment variables setup
│   │
│   ├── 📦 controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── subscriptionController.js
│   │   ├── paymentController.js
│   │   └── deliveryController.js
│   │
│   ├── 🛣️ routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── deliveryRoutes.js
│   │
│   ├── 🧠 models/
│   │   ├── userModel.js
│   │   ├── productModel.js
│   │   ├── orderModel.js
│   │   ├── subscriptionModel.js
│   │   ├── paymentModel.js
│   │   └── deliveryModel.js
│   │
│   ├── 🛡️ middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── errorMiddleware.js      # Global error handler
│   │   ├── validationMiddleware.js # Request validation
│   │
│   ├── 🔧 services/
│   │   ├── supabaseService.js      # Supabase queries
│   │   ├── paymentService.js       # Payment logic
│   │   ├── subscriptionService.js  # Subscription handling
│   │
│   ├── 🧾 utils/
│   │   ├── generateToken.js
│   │   ├── logger.js
│   │   ├── constants.js
│   │
│   ├── 📊 validators/
│   │   ├── authValidator.js
│   │   ├── productValidator.js
│   │   ├── orderValidator.js
│   │
│   └── 📁 database/
│       ├── schema.sql             # PostgreSQL schema
│       ├── seed.sql               # Sample data
│
├── 📁 docs/
│   ├── api-docs.md               # API documentation
│   ├── db-design.md              # Database design
│
└── 📁 tests/
    ├── auth.test.js
    ├── product.test.js
    ├── order.test.js

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/dairydirect-backend.git
cd dairydirect-backend
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_secret_key
```

---

### 4️⃣ Run the server

```
npm start
```

Server will run on:

```
http://localhost:5000
```

---

## 🔌 API Endpoints (Example)

### Auth

```
POST /api/auth/register
POST /api/auth/login
```

### Products

```
GET /api/products
POST /api/products
```

### Orders

```
POST /api/orders
GET /api/orders
```

---

## 💳 Payment Status

| Status    | Meaning                               |
| --------- | ------------------------------------- |
| ACTIVE    | Order is ongoing after payment        |
| COMPLETED | Order finished and payment done       |
| OVERDUE   | Time exceeded but payment not updated |
| REFUNDED  | User cancelled booking and got refund |

---

## 🛡️ Security Practices

* Input validation (middleware)
* JWT Authentication
* Environment variables for secrets
* CORS protection
* Error handling

---
