# ⚙️ DairyDirect Backend — Express.js API

The backend services for DairyDirect, providing core business logic, database management, and administrative API endpoints.

## 🚀 Key Updates

*   **🔐 Firebase Auth Integration**: Shifted from traditional email/password to Firebase ID Token verification for secure mobile authentication.
*   **📊 Admin Services**: Robust endpoints for managing products, orders, and subscription lifecycles.
*   **📡 Real-time Synchronization**: Works in tandem with Supabase to provide live updates to the frontend.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL (via Supabase)
*   **Auth**: Firebase Admin SDK
*   **Validation**: Joi / express-validator

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file from `.env.example`:
```bash
# General
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_url
SUPABASE_KEY=your_service_role_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 3. Running the Server

**Development Mode (Nodemon):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```
Server runs on `http://localhost:4000`.

## 📁 API Surface

### 1. Authentication
*   `POST /api/auth/verify-token`: Verifies Firebase ID tokens and returns application session info.

### 2. Products
*   `GET /api/products`: List all products.
*   `GET /api/products/:id`: Get product details.
*   `POST /api/admin/products`: (Admin) Create/Update products.

### 3. Orders & Subscriptions
*   `POST /api/orders`: Place a new order.
*   `GET /api/subscriptions`: View subscription status.
*   `PATCH /api/admin/orders/:id`: (Admin) Update order/delivery status.

## 📁 Project Structure

*   `src/controllers`: Request handlers and business logic.
*   `src/routes`: API endpoint definitions.
*   `src/models`: Database schema and integration logic.
*   `src/middlewares`: Auth guards and error handlers.
*   `index.js`: Main entry point.
