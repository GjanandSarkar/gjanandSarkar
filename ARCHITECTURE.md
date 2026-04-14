# 🏗️ DairyDirect Architecture

This document explains the technical design and data flow of the DairyDirect platform.

## 🏛️ System Overview

DairyDirect follows a **Monorepo** structure, providing everything needed for a dairy commerce business in one place.

### 1. Frontend (Next.js 14+)
- **Primary Framework**: Next.js App Router for server-side rendering and API routes.
- **Client State**: **Zustand** is used for the cart and user session persistence.
- **Styling**: Vanilla CSS with **Tailwind CSS** for a premium, custom aesthetic.
- **Animations**: **Framer Motion** for liquid-smooth transitions.

### 2. Backend Strategy (Dual-Tier)
DairyDirect is unique in offering two ways to handle backend logic:
- **Built-in (Primary)**: Heavy usage of Next.js API Routes (`/src/app/api`). This handles Auth, Order Placement, and Pricing.
- **Standalone (Optional)**: A dedicated Node.js/Express service in the `backend/` directory. This is intended for developers who want to migrate to a microservices architecture.

### 3. Database (Supabase / PostgreSQL)
- **Supabase** handles authentication and real-time database updates.
- **RLS (Row Level Security)** is strictly enforced: users can only see their own orders and cart items.
- **Schema Safety**: Business logic is partially enforced via PostgreSQL `CHECK` constraints (e.g., `profit_check`).

---

## 💰 The Profit-Safe Pricing Engine

At the heart of the platform is the **Pricing Engine** (`lib/pricing.ts`).

### How it works:
1. **Source of Truth**: When an order is placed, the backend ignores prices sent from the client.
2. **Re-calculation**: Every item is fetched from the database to get its `cost_price` and `selling_price`.
3. **Margin Protection**: The engine calculates:
   `Final Selling Price - Discount >= Cost Price + Min Profit Margin`
4. **Safety Valve**: If a coupon makes an order unprofitable, the engine automatically reduces the discount or rejects the order.

---

## 🚦 Data Flow

1. **Ordering**:
   `Frontend (Cart)` → `API (/api/orders/place)` → `Pricing Engine` → `PostgreSQL (Orders)` → `Notification Service`

2. **Delivery Fees**:
   `Frontend` → `API (/api/coupons/validate)` → `Pricing Engine` (checks against `business_settings` table).

---

## 🤖 AI Development Flow

The project is structured to be "Self-Documenting" for AI tools:
- Database changes should be documented in `dairydirect/database/supabase/schema.sql`.
- API endpoints map directly to folder names in `frontend/src/app/api`.
- All shared logic is localized in `frontend/src/lib`.
