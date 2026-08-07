# 🏛️ Gjanand Sarkar (DairyDirect) — Supabase Pro Production Architecture

**DairyDirect (Gjanand Sarkar)** is a high-performance dairy e-commerce platform engineered with **Next.js 16**, **Supabase Pro (PostgreSQL 16, Auth, Storage, Realtime)**, **Razorpay Payments**, and **Redis Caching**.

---

## 📐 High-Level Architecture Diagram

```
                                [ Cloudflare / Vercel Edge CDN ]
                                                │
                                                ▼
                             [ Next.js 16 Full-Stack Application ]
                                  (App Router + Route Handlers)
                                                │
               ┌────────────────────────────────┼────────────────────────────────┐
               │                                │                                │
               ▼                                ▼                                ▼
    [ Supabase Pro Database ]        [ Supabase Pro Auth ]            [ Supabase Storage ]
   (Postgres 16 + RLS Policies)       (Google OAuth & Phone OTP)       (Products & Reports)
               │                                │                                │
               ▼                                ▼                                ▼
     [ Redis Cache / Rate Limit ]     [ Razorpay Payment Gateway ]      [ Admin Control Suite ]
    (OTP + Session Rate-Limiting)    (Instant UPI, Cards & Webhooks)    (Stats, Stock & Freshness)
```

---

## 🛠️ Core Technology Stack

| Layer | Technology | Role & Key Features |
|---|---|---|
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS | SSR + CSR, Mobile-First, Framer Motion animations |
| **Backend API** | Next.js Server Route Handlers | Strict Zod validation, parameterised SQL, audit logging |
| **Primary Database** | Supabase Pro (PostgreSQL 16 with Supavisor) | ACID transactions, Row Level Security, atomic order placement |
| **Authentication** | Supabase Auth & JWT Session Tokens | Google One-Tap, SMS Phone OTP, HttpOnly cookie sessions |
| **Media & Storage** | Supabase Pro Storage | Public `products` & `quality-reports`, private `return-claims` |
| **Realtime Updates** | Supabase Realtime Channels | Instant order status notifications & admin alerts |
| **Payment Gateway** | Razorpay Node.js SDK | UPI Instant Pay, Cards, NetBanking, HMAC-SHA256 verification |
| **Cache & Rate-Limit** | Redis (Upstash / Cloud / In-Memory fallback) | Sliding window rate-limiting, catalog caching |

---

## 🔒 Security & Defense-in-Depth

1. **Payment Signature Verification**: Every Razorpay transaction (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) is validated cryptographically using `HMAC-SHA256` in constant time (`timingSafeEqual`) to prevent payment tampering.
2. **Profit-Margin Safeguard**: Dynamic calculation against unit cost prices prevents negative profit margins from coupon abuse.
3. **Atomic Stock Decrement**: Transactions lock variant rows with `SELECT FOR UPDATE` to prevent overselling.
4. **Row-Level Security (RLS)**: Fine-grained PostgreSQL RLS policies guarantee customers can only access their own orders and profile data.
5. **Role-Based Access Control (RBAC)**: Admin routes (`/admin/*` and `/api/admin/*`) enforce strict role validation via JWT claims and environment admin whitelisting.

---

## 📊 Database Schema Summary (`database/supabase/schema.sql`)

- **`profiles`**: User profiles with roles (`customer`, `admin`, `seller`), loyalty points, referral codes, default UPI.
- **`products` & `product_variants`**: Catalog with weights, prices, cost prices, live stock, batch numbers, freshness certificates.
- **`orders` & `order_items`**: Order lifecycle (`pending` → `confirmed` → `out_for_delivery` → `delivered` → `cancelled`).
- **`subscriptions`**: Daily/alternate milk delivery plans, pause/resume mechanisms, volume selections.
- **`return_requests`**: 100% Freshness Guarantee return claims, photo evidence, refund processing.
- **`delivery_slots`**: Operational time slots (`5:00 AM - 7:00 AM`, `7:00 AM - 9:00 AM`, `5:00 PM - 7:00 PM`).
- **`business_settings`**: Minimum order limits, delivery fees, free delivery thresholds, profit margin minimums.
- **`notifications`**: Realtime user alerts and administrative events.
- **`audit_logs`**: Administrative audit trail for financial adjustments and stock updates.
