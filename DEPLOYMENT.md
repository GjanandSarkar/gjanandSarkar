# 🚀 AWS Production Deployment Guide — Gjanand Sarkar (DairyDirect)

This guide walks you through deploying the DairyDirect production stack to **Amazon Web Services (ap-south-1 Mumbai)** and configuring **Razorpay Payments**.

---

## 📋 Prerequisites

1. **AWS Account**: Configured in region `ap-south-1` (Mumbai).
2. **AWS CLI** installed & authenticated: `aws configure`.
3. **Razorpay Account**: Live & Test API Keys from [Razorpay Dashboard](https://dashboard.razorpay.com/).
4. **Domain & SSL**: Registered domain (Route 53 or external) + ACM SSL certificate.

---

## 🗄️ Step 1: Amazon RDS PostgreSQL Provisioning

1. Open **AWS RDS Console** > **Create Database**.
2. Select **PostgreSQL 16**.
3. Choose **Production** template (or **Dev/Test** for staging).
4. Settings:
   - **DB Identifier**: `dairydirect-prod-db`
   - **Master Username**: `postgres` (or `dairydirect_admin`)
   - **Master Password**: *Generate a secure 32-character password*
   - **Instance Class**: `db.t4g.medium` or `db.t4g.micro`
   - **Storage**: 20GB – 100GB GP3 with autoscaling
   - **VPC / Subnet**: Default VPC or private VPC subnet
   - **Public Access**: `Yes` (if accessing directly from outside VPC) or `No` (with bastion/VPC peering)
5. Initialize the database schema:
   ```bash
   psql -h <RDS_ENDPOINT> -U postgres -d postgres -f dairydirect/database/rds/schema.sql
   psql -h <RDS_ENDPOINT> -U postgres -d dairydirect -f dairydirect/database/rds/seed.sql
   ```

---

## ⚡ Step 2: Amazon ElastiCache (Redis) Setup

1. Go to **AWS ElastiCache** > **Redis Clusters** > **Create**.
2. Choose **Redis (Cluster Mode Disabled)**.
3. Node type: `cache.t4g.micro` (or use a managed Redis such as Redis Cloud / Upstash).
4. Note your Redis Primary Endpoint: `redis://<endpoint>:6379`.

---

## 📦 Step 3: Amazon S3 Bucket & CloudFront CDN

1. Go to **AWS S3** > **Create Bucket**:
   - **Bucket Name**: `gjanandsarkar-product-media`
   - **Region**: `ap-south-1` (Mumbai)
   - Enable **CORS** for uploads:
     ```json
     [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
         "AllowedOrigins": ["https://gjanandsarkar.com", "http://localhost:3000"],
         "ExposeHeaders": ["ETag"]
       }
     ]
     ```
2. (Optional) Create a **CloudFront Distribution** pointing to your S3 bucket for lightning-fast asset delivery across India.

---

## 📧 Step 4: Amazon SES (Email) & SNS (SMS) Setup

1. **Amazon SES**:
   - Go to **SES Console** > **Verified Identities**.
   - Verify your sending domain (e.g. `gjanandsarkar.com`) or email (`orders@gjanandsarkar.com`).
   - Request Production Access in `ap-south-1` if currently in sandbox.
2. **Amazon SNS**:
   - Enable SMS preferences under SNS Console > Text messaging (SMS).
   - Set Default Sender ID (e.g., `GJANAND`).

---

## 💳 Step 5: Razorpay Gateway Configuration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings > API Keys** > Generate `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`.
3. Navigate to **Settings > Webhooks** > Add new Webhook:
   - **Webhook URL**: `https://gjanandsarkar.com/api/payments/webhook`
   - **Secret**: *Set a secure string for `RAZORPAY_WEBHOOK_SECRET`*
   - **Active Events**: `order.paid`, `payment.captured`, `payment.failed`, `refund.processed`

---

## ⚙️ Step 6: Production Environment Variables

Create `.env.production` (or configure in AWS App Runner / Amplify / ECS environment):

```env
# ─── App Environment ─────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gjanandsarkar.com

# ─── AWS RDS PostgreSQL ──────────────────────────────────────
AWS_RDS_HOST=dairydirect-prod-db.xxxxxx.ap-south-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=dairydirect
AWS_RDS_USERNAME=postgres
AWS_RDS_PASSWORD=your_secure_rds_password

# ─── AWS ElastiCache / Redis ─────────────────────────────────
REDIS_URL=redis://your-elasticache-endpoint.ap-south-1.cache.amazonaws.com:6379

# ─── AWS S3 & CloudFront ─────────────────────────────────────
AWS_REGION=ap-south-1
AWS_S3_BUCKET=gjanandsarkar-product-media
AWS_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── AWS SES (Email) & SNS (SMS) ─────────────────────────────
SES_FROM_EMAIL=orders@gjanandsarkar.com
SNS_SENDER_ID=GJANAND

# ─── JWT Authentication ──────────────────────────────────────
JWT_SECRET=your-production-jwt-secret-min-32-chars-long-secure
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars-long-secure

# ─── Razorpay Payment Gateway ────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_key

# ─── Admin Configuration ─────────────────────────────────────
ADMIN_PHONES=+919876543210,+919988776655
ADMIN_EMAILS=admin@gjanandsarkar.com
```

---

## 🚀 Step 7: Application Deployment Options

### Option A: AWS App Runner (Fastest & Fully Managed Container)
1. Go to **AWS App Runner** > **Create Service**.
2. Source: **Source code repository** (GitHub) or **Container registry** (ECR).
3. Build command: `npm run build`
4. Start command: `npm start`
5. Port: `3000`
6. Add environment variables.

### Option B: Docker / ECS Fargate
```bash
cd dairydirect/frontend
docker build -t dairydirect-app .
# Push to Amazon ECR and deploy to ECS Fargate service behind an Application Load Balancer
```

### Option C: Vercel / AWS Amplify with Native AWS Backend
- Deploy frontend to Vercel or AWS Amplify.
- Point database and AWS environment variables directly to your AWS RDS, Redis, S3, and SES instances in `ap-south-1`.

---

## 🔄 Step 8: Historical Data Migration (from Supabase)

If migrating existing customer records and past orders from Supabase:
```bash
cd dairydirect/database/rds
# Ensure .env.local has both old Supabase and new AWS RDS credentials
npx ts-node migrate-supabase-to-rds.ts
```

---

## ✅ Post-Deployment Verification Checklist

- [ ] Health Check: `GET /api/health` returns `{"status":"ok","database":true,"redis":true}`
- [ ] Admin Portal: Access `/admin` with an authenticated admin phone/email
- [ ] Product Catalog: View products on `/products`
- [ ] Cart & Pricing: Add items to cart and check automated profit margin & discount calculation
- [ ] Payment Flow: Place an order with Razorpay test/live checkout
- [ ] Webhook Verification: Confirm `order.paid` webhook marks orders as paid automatically
- [ ] Freshness Guarantee: Submit a return request on `/returns` and verify in `/admin/returns`
- [ ] Live Tracking: Track order delivery status on `/tracking/[id]`
