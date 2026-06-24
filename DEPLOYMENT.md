# 🚀 Deployment Guide — Gjanand Sarkar

This guide covers deploying the application to **Vercel** (frontend) and **Supabase** (backend/database).

---

## 📋 Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed (`npm i -g vercel`)
- [Supabase](https://supabase.com) account
- [Google Cloud Console](https://console.cloud.google.com) account (for OAuth)

---

## 🗄️ Step 1: Supabase Setup

1. Create a new Supabase project
2. Go to **SQL Editor** and run the schema:
   ```bash
   # Copy contents of dairydirect/database/supabase/schema.sql
   # Paste into Supabase SQL Editor and run
   ```
3. Run the seed data:
   ```bash
   # Copy contents of dairydirect/database/supabase/seed.sql
   # Paste into Supabase SQL Editor and run
   ```
4. Enable **Google OAuth** in Supabase:
   - Go to **Authentication > Providers**
   - Enable **Google**
   - Enter your Google OAuth Client ID and Secret
5. Get your project credentials:
   - **Project URL**: `https://<project-id>.supabase.co`
   - **Anon Key**: Project Settings > API > `anon` key
   - **Service Role Key**: Project Settings > API > `service_role` key

---

## 🔐 Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID**
3. Add authorized redirect URIs:
   ```
   https://<project-id>.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** (you'll need it for environment variables)

---

## ⚙️ Step 3: Environment Variables

Create `.env.local` in `dairydirect/frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_ADMIN_EMAILS=admin@gjanandsarkar.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## ☁️ Step 4: Vercel Deployment

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository
4. Set the **Root Directory** to `dairydirect/frontend`
5. Add the environment variables from Step 3
6. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
cd dairydirect/frontend
vercel --prod
```

---

## 🔒 Step 5: Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is **never** exposed in client-side code
- [ ] RLS policies are enabled in Supabase
- [ ] Only authorized emails are in `NEXT_PUBLIC_ADMIN_EMAILS`
- [ ] Google OAuth is restricted to your domain (optional)
- [ ] `next.config.ts` has security headers configured

---

## 🔄 Step 6: Post-Deployment

1. **Test the auth flow**:
   - Visit `https://your-app.vercel.app/login`
   - Sign in with Google
   - Verify profile is created in Supabase

2. **Verify admin access**:
   - Sign in with an email from `NEXT_PUBLIC_ADMIN_EMAILS`
   - Verify you can access `/admin`
   - Verify you can manage products, orders, etc.

3. **Test customer flow**:
   - Sign in with a non-admin email
   - Browse products, add to cart
   - Place an order
   - Verify order appears in admin panel

---

## 📊 Step 7: Monitoring

- **Vercel Analytics**: Enable in Vercel Dashboard
- **Supabase Logs**: Check SQL Editor > Logs
- **Error Tracking**: Consider adding Sentry or similar
- **Uptime**: Use Vercel's built-in monitoring or UptimeRobot

---

## 🔧 Troubleshooting

**Build fails on Vercel but works locally:**
- Ensure all environment variables are set in Vercel Dashboard
- Check that `NEXT_PUBLIC_SUPABASE_URL` does not have a trailing slash

**Google OAuth redirect loop:**
- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel domain
- Check Supabase OAuth redirect URIs

**RLS errors in production:**
- Ensure `profiles` table has entries for all users
- Check that `auth.uid()` matches `profiles.id`

---

## 📝 Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g. https://app.vercel.app) |
