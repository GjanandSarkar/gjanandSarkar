# 🥛 Gjanand Sarkar — Farm Fresh Dairy Delivery Platform

Gjanand Sarkar is a production-ready, open-source hyper-local delivery platform built with **Next.js (App Router)** and **Supabase**. It is designed to provide a premium, white-label experience for farm-to-door dairy businesses with robust production infrastructure, real-time analytics, and advanced pricing safeguards.

---

## 🚀 Quick Start (Run in < 5 mins)

1. **Clone the Repo**
    ```bash
    git clone https://github.com/GjanandSarkar/gjanandSarkar.git
    cd gjanandSarkar
    ```

2. **Install Dependencies**
    ```bash
    cd dairydirect/frontend
    npm ci
    ```

3. **Setup Database**
    - Create a new project on [Supabase](https://supabase.com).
    - Run the SQL in `dairydirect/database/supabase/schema.sql` in the Supabase SQL Editor.
    - Run `dairydirect/database/supabase/seed.sql` to populate products.

4. **Environment Variables**
    - Copy `dairydirect/frontend/.env.local.example` to `dairydirect/frontend/.env.local`.
    - Fill in your Supabase keys, Google OAuth Client ID, and Sentry DSN.

5. **Start Dev Server**
    ```bash
    npm run dev
    ```

---

## ✨ Features

- **📱 Mobile-First UI**: Premium, responsive interface designed for hyper-local delivery.
- **📊 Business Intelligence**: Real-time admin dashboard tracking MRR, Churn, AOV, and subscription cohort data.
- **🔐 Secure Auth & RBAC**: Google OAuth authentication with robust Role-Based Access Control protecting Admin routes.
- **💰 Profit-Safe Pricing**: Centralized pricing engine that strictly prevents discounts from dropping below cost + margin.
- **🎟️ Dynamic Coupons**: Campaign-ready coupon system with flat and percentage discounts.
- **📍 Smart Delivery**: Location-based tracking and centralized business settings for delivery fees.
- **🔔 Real-time Notifications**: Instant updates for order confirmation and delivery status.
- **📈 Infrastructure Ready**: Built-in CI/CD (GitHub Actions), Rate Limiting, Sentry Error Tracking, and Uptime monitoring.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Recharts.
- **Backend**: Next.js API Routes (Serverless / Edge).
- **Database**: PostgreSQL (Supabase), Row Level Security (RLS) enabled.
- **Infrastructure**: Vercel Serverless, GitHub Actions (CI), Sentry (Monitoring).
- **Auth**: Supabase Google OAuth.

---

## 📂 Folder Structure

```text
/gjanandSarkar
├── .github/workflows/          # CI/CD Production Pipelines
├── dairydirect/
│   ├── frontend/               # Next.js Application (Primary)
│   ├── database/               # SQL Schema & Seed scripts
│   └── docs/                   # Internal Architecture Documentation
```

---

## 📖 Key Documentation

- [**Architecture**](./ARCHITECTURE.md) — How the system pieces fit together.
- [**Profit-Safe Engine**](./dairydirect/docs/PRICING.md) — Deep dive into the pricing guardian logic.
- [**Production Infrastructure**](./dairydirect/docs/STARTUP_PRODUCTION_INFRASTRUCTURE.md) — Deployment, CI/CD, and Monitoring guide.
- [**Analytics & BI**](./dairydirect/docs/ANALYTICS_AND_BUSINESS_INTELLIGENCE.md) — Admin dashboard metric formulas and logic.

---

## ⚖️ License

MIT License. Feel free to use this for your business or project.
