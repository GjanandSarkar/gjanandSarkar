# 🥛 DairyDirect — Hyper-Local Dairy Delivery Platform

DairyDirect is a production-ready, open-source hyper-local delivery platform built with **Next.js (App Router)** and **Supabase**. It is designed to provide a premium, white-label experience for farm-to-door dairy businesses.

---

## 🚀 Quick Start (Run in < 5 mins)

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-username/dairy-ecommerce-platform.git
   cd dairy-ecommerce-platform
   ```

2. **Install Dependencies**
   ```bash
   # Install everything across workspaces
   npm run install:all
   ```

3. **Setup Database**
   - Create a new project on [Supabase](https://supabase.com).
   - Run the SQL in `dairydirect/database/supabase/schema.sql` in the Supabase SQL Editor.
   - Run `dairydirect/database/supabase/seed.sql` to populate products.

4. **Add Environment Variables**
   - Create a `.env.local` file in `dairydirect/frontend`.
   - Use the template from `.env.example`.

5. **Start Dev Server**
   ```bash
   npm run dev
   ```

---

## ✨ Features

- **📱 Mobile-First UI**: Premium, responsive interface designed for hyper-local delivery.
- **🔐 Secure Auth**: Phone-based authentication simulated for rapid testing and production-ready flow.
- **💰 Profit-Safe Pricing**: Centralized pricing engine that prevents sales below cost + margin.
- **🎟️ Dynamic Coupons**: Campaign-ready coupon system with flat and percentage discounts.
- **📍 Smart Delivery**: Location-based tracking and centralized business settings for delivery fees.
- **🔔 Real-time Notifications**: Instant updates for order confirmation and delivery status.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend (Internal)**: Next.js API Routes (Serverless).
- **Backend (Standalone)**: Express.js + Node.js (Optional scaling service).
- **Database**: PostgreSQL (Supabase), Row Level Security (RLS) enabled.
- **State Mgmt**: Zustand.

---

## 📂 Folder Structure

```text
/dairy-ecommerce-platform
├── dairydirect/
│   ├── frontend/     # Next.js Application (Primary)
│   ├── backend/      # Express Standalone Service (Optional)
│   ├── database/     # SQL Schema & Seed scripts
│   └── docs/         # Extra technical documentation
```

---

## 🤖 AI & Vibe Coding Friendly

DairyDirect is optimized for AI coding assistants (Cursor, Windsurf, etc.).

### Where to modify?
- **Business Logic**: Most core calculations happen in `frontend/src/lib/pricing.ts`.
- **UI Components**: Check `frontend/src/components/ui` for primitives.
- **API Routes**: Located in `frontend/src/app/api/`.
- **Database**: Modifications to `schema.sql` should be applied to Supabase.

---

## 📖 Key Documentation

- [**Architecture**](./ARCHITECTURE.md) — How the system pieces fit together.
- [**Contributing**](./CONTRIBUTING.md) — How to help improve DairyDirect.
- [**Profit-Safe Engine**](./dairydirect/docs/PRICING.md) — Deep dive into the pricing guardian logic.

---

## ⚖️ License

MIT License. Feel free to use this for your business or project.