# 🏛️ DairyDirect — Enterprise AWS Architecture & System Design

DairyDirect (Gjanand Sarkar) is built on an enterprise-grade AWS infrastructure engineered specifically for high-reliability dairy commerce, automated subscription fulfillment, freshness guarantee tracking, and payment processing.

---

## 📐 High-Level Architecture Diagram

```
                              [ Cloudflare / AWS Route 53 + ACM SSL ]
                                                 │
                                                 ▼
                                     [ AWS CloudFront CDN ]
                             (Static Assets, Product Media, Edge Caching)
                                                 │
                                                 ▼
                              [ AWS App Runner / ECS Fargate / EC2 ]
                               (Next.js 16 Full-Stack Application)
                                                 │
                      ┌──────────────────────────┼──────────────────────────┐
                      │                          │                          │
                      ▼                          ▼                          ▼
          [ Amazon RDS PostgreSQL ]    [ Amazon ElastiCache Redis ]     [ Amazon S3 Bucket ]
           (ap-south-1 Multi-AZ)           (Session & Rate Limiting)      (Product & Batch Images)
                      │                          │
                      ▼                          ▼
             [ Amazon SES ]                [ Amazon SNS ]               [ Razorpay Gateway ]
         (Transactional Emails)             (SMS / OTPs)               (UPI / Cards / Webhooks)
```

---

## 🛠️ Core Technology Stack

| Layer | Technology | Role & Key Features |
|---|---|---|
| **Frontend UI** | Next.js 16 (App Router), React 19, Tailwind CSS | SSR + CSR, Responsive Mobile-First, Framer Motion |
| **Backend API** | Next.js Server Route Handlers | Node.js Runtime, strict Zod validation, parameterised SQL |
| **Primary Database** | Amazon RDS PostgreSQL 16 (ap-south-1) | Connection pooling (`pg`), ACID transactions, stock locking |
| **In-Memory Cache** | Amazon ElastiCache Redis (or Redis Cloud) | OTP storage, session caching, Sliding Window Rate-Limiting |
| **Storage & CDN** | Amazon S3 + Amazon CloudFront | Pre-signed uploads, low latency asset delivery across India |
| **Communications** | Amazon SES & Amazon SNS | Order confirmation emails, SMS OTP verification |
| **Payment Engine** | Razorpay Node.js SDK | UPI Instant Autopay, Cards, NetBanking, HMAC verification |
| **Auth & Security** | Web Crypto HS256 JWT, CSRF Tokens | HttpOnly SameSite cookies, XSS & SQLi sanitization |

---

## 🔒 Security & Risk Defense

1. **Payment Bypass Prevention**: Every payment signature (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) is verified using cryptographic `HMAC-SHA256` in constant time (`timingSafeEqual`).
2. **Profit-Safety Guard**: Server-side pricing engine (`lib/pricing.ts`) computes profit margins dynamically against database cost prices. Coupons are capped to prevent negative margins.
3. **Atomic Stock Decrement**: Order placements execute inside PostgreSQL ACID transactions (`withTransaction` in `lib/aws/rds.ts`) with `FOR UPDATE` row-level locks, preventing overselling during traffic spikes.
4. **Brute-Force & DDoS Mitigation**: Redis token-bucket rate-limiting blocks OTP brute-forcing and API abuse.
5. **Role-Based Access Control**: Server-side JWT role claims (`role: 'admin'`) protect all admin routes and API handlers.

---

## 📊 Database Schema Summary (`database/rds/schema.sql`)

- **`profiles`**: User identities, phone/email, role (`customer` / `admin`), loyalty points, referral codes.
- **`products` & `product_variants`**: Catalog with weights, prices, cost prices, stock count, low-stock threshold, expiry dates, batch numbers.
- **`orders` & `order_items`**: Order lifecycle (`pending` → `confirmed` → `out_for_delivery` → `delivered` → `cancelled`), slot selection, payment status.
- **`subscriptions`**: Daily/alternate milk subscriptions, delivery slots, auto-renewal.
- **`return_requests`**: 100% Freshness Guarantee return claims, photo evidence, refund processing.
- **`delivery_slots`**: Time slots (`5:00 AM - 7:00 AM`, `7:00 AM - 9:00 AM`, `5:00 PM - 7:00 PM`) with capacity tracking.
- **`business_settings`**: Minimum order values, delivery fees, free delivery thresholds, profit margin minimums.
- **`audit_logs`**: Admin activity and financial adjustments tracking.
