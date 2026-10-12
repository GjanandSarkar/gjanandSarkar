# 🚀 Production Deployment & Manual Work Setup Guide — Gjanand Sarkar

This comprehensive guide covers all manual steps and configuration required to launch **Gjanand Sarkar (DairyDirect)** on **Supabase Pro** with **Razorpay Payments** and **Vercel / Next.js Hosting**.

---

## 📑 Table of Contents
1. [Step 1: Supabase Pro Project Setup](#step-1-supabase-pro-project-setup)
2. [Step 2: Database Schema & Seed Execution](#step-2-database-schema--seed-execution)
3. [Step 3: Supabase Storage Buckets Setup](#step-3-supabase-storage-buckets-setup)
4. [Step 4: Supabase Authentication Setup (Google OAuth & Phone OTP)](#step-4-supabase-authentication-setup)
5. [Step 5: Razorpay Payment Gateway Integration](#step-5-razorpay-payment-gateway-integration)
6. [Step 6: Environment Variables Configuration](#step-6-environment-variables-configuration)
7. [Step 7: Vercel / Cloud Hosting Deployment](#step-7-vercel--cloud-hosting-deployment)
8. [Step 8: Post-Deployment Verification Checklist](#step-8-post-deployment-verification-checklist)

---

## 🗄️ Step 1: Supabase Pro Project Setup

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**:
   - **Name**: `gjanand-sarkar-prod`
   - **Database Password**: *Generate and save a strong 32-character password*
   - **Region**: `ap-south-1` (Mumbai, India) — *Crucial for ultra-low latency for Indian customers*
   - **Pricing Plan**: Pro Tier
3. Once provisioned, navigate to **Project Settings > API**:
   - Copy **Project URL** (`https://xxxxxxxx.supabase.co`)
   - Copy **anon / public key**
   - Copy **service_role / secret key**
4. Navigate to **Project Settings > Database**:
   - Copy the **Connection string (URI / Transaction pooler port 6543)**

---

## 📜 Step 2: Database Schema & Seed Execution

1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Click **New Query**.
3. Open [schema.sql](file:///Users/roshanpatel193052005gmail.com/Data/PROJECTS(2026)/GjanandSarkar/gjanandSarkar/dairydirect/database/supabase/schema.sql), copy the entire SQL script, paste it into the SQL Editor, and click **Run**.
   - *This creates all tables, enums, triggers, RLS policies, and atomic order placement functions (`place_order_atomic`).*
4. Click **New Query** again.
5. Open [seed.sql](file:///Users/roshanpatel193052005gmail.com/Data/PROJECTS(2026)/GjanandSarkar/gjanandSarkar/dairydirect/database/supabase/seed.sql), copy the contents, paste into the SQL Editor, and click **Run**.
   - *This populates active products (A2 Cow Milk, Pure Desi Ghee, Farm Fresh Paneer, Buffalo Milk), delivery slots, coupons (`WELCOME100`, `FREEDEL`), and store settings.*

---

## 📦 Step 3: Supabase Storage Buckets Setup

Navigate to **Storage** in the Supabase Dashboard:

1. **Bucket 1: `products`**
   - Click **New Bucket** → Name: `products`
   - Toggle **Public Bucket**: `ON`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/svg+xml`
   - Max file size: `5 MB`
2. **Bucket 2: `quality-reports`**
   - Click **New Bucket** → Name: `quality-reports`
   - Toggle **Public Bucket**: `ON`
   - Allowed MIME types: `application/pdf, image/jpeg, image/png`
   - Max file size: `10 MB`
3. **Bucket 3: `return-claims`**
   - Click **New Bucket** → Name: `return-claims`
   - Toggle **Public Bucket**: `OFF` (Private — access controlled via signed URLs)
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
   - Max file size: `10 MB`

---

## 🔐 Step 4: Supabase Authentication Setup

Navigate to **Authentication > Providers** in the Supabase Dashboard:

### 1. Google OAuth (One-Tap & Social Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services > Credentials**.
2. Create **OAuth 2.0 Client ID** (Web application).
3. Add Authorized Redirect URI from Supabase: `https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback`.
4. In Supabase Dashboard, toggle **Google** to `ON`, enter your `Client ID` and `Client Secret`, and save.

### 2. Phone OTP (SMS Verification)
1. In Supabase Dashboard, navigate to **Authentication > Providers > Phone**.
2. Toggle **Phone** to `ON`.
3. Choose your SMS Provider (e.g. **Twilio**, **MessageBird**, or **Custom HTTP Gateway** like Msg91):
   - Enter your SMS API credentials.
   - Configure the SMS template (e.g., `Your Gjanand Sarkar verification code is: {{ .Code }}`).

---

## 💳 Step 5: Razorpay Payment Gateway Integration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Account & Settings > API Keys**:
   - Generate your `Key ID` and `Key Secret` (switch to **Live Mode** when ready for live transactions).
3. Navigate to **Account & Settings > Webhooks**:
   - Click **Add New Webhook**.
   - **Webhook URL**: `https://your-domain.com/api/payments/webhook`
   - **Secret**: *Enter a secure random string (save this as `RAZORPAY_WEBHOOK_SECRET`)*
   - **Active Events**:
     - `order.paid`
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
4. Click **Save**.

---

## ⚙️ Step 6: Environment Variables Configuration

Create a `.env.production` file or add these in your Vercel Project Settings:

```env
# ─── Next.js App ─────────────────────────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gjanandsarkar.com

# ─── Supabase Pro Credentials ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# PostgreSQL Connection String (Transaction Pooler - Port 6543)
DATABASE_URL=postgresql://postgres.your-project-id:your-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# ─── Razorpay Payment Gateway ────────────────────────────────────────────────
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ─── Redis Caching & Rate Limiting ───────────────────────────────────────────
REDIS_URL=redis://default:password@your-redis-host:6379

# ─── Session Security (JWT) ──────────────────────────────────────────────────
JWT_SECRET=your-32-character-secret-key-for-jwt-signing
JWT_REFRESH_SECRET=your-32-character-secret-for-refresh-token

# ─── Admin Access Whitelist ──────────────────────────────────────────────────
ADMIN_EMAILS=admin@gjanandsarkar.com,patelroshu1218@gmail.com
ADMIN_PHONES=+919876543210
```

---

## 🚢 Step 7: Vercel / Cloud Hosting Deployment

1. Push your code to your GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `dairydirect/frontend`.
5. Paste all Environment Variables from Step 6.
6. Click **Deploy**.

---

## ✅ Step 8: Post-Deployment Verification Checklist

- [ ] **Health Check**: Visit `https://your-domain.com/api/health` — should return `{"status":"ok","database":true}`.
- [ ] **Catalog Display**: Browse `/products` and ensure all dairy items (Milk, Ghee, Paneer) render with correct prices and stock.
- [ ] **Authentication**: Test login with Google One-Tap or Phone OTP.
- [ ] **Cart & Checkout**: Add items to cart, enter delivery address, choose a delivery slot (Morning/Evening), and apply coupon `WELCOME100`.
- [ ] **Razorpay Payment**: Complete a test/live payment and verify immediate redirect to `/order-confirmed/[id]`.
- [ ] **Admin Portal**: Log in as an admin and access `/admin` to verify:
  - Live order overview & status transitions (`pending` → `confirmed` → `out_for_delivery` → `delivered`)
  - Inventory stock level adjustments and low-stock alerts
  - Return requests review and freshness guarantee approvals
  - Financial reports and daily revenue statistics
