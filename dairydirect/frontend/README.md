# 🖥️ Gjanand Sarkar Frontend — Next.js 15+

The frontend for Gjanand Sarkar is a high-performance, mobile-first web application built with **Next.js 15+ (App Router)**, **TypeScript**, and **Tailwind CSS**. It serves as the primary interface for customers and administrators.

## ✨ Core Features

*   **📱 Mobile-First Design**: Responsive UI optimized for mobile devices with professional Lucide icons.
*   **🔐 Google OAuth**: Seamless login using Supabase Google Authentication.
*   **🌐 Multi-Language Support**: Complete localization in **Hindi** and **English**, persisting across sessions.
*   **📦 Subscription Dashboard**: Real-time tracking of active milk plans and upcoming deliveries.
*   **🛒 Shopping Experience**: Full E-commerce flow for products like Ghee, Paneer, and Buttermilk.
*   **📊 Business Intelligence Dashboard**: Advanced charts and revenue metrics powered by Recharts.
*   **🛡️ Rate Limiting & Monitoring**: Built-in API rate limiters, uptime endpoints, and Sentry error tracking.

## 🛠️ Tech Stack

*   **Framework**: Next.js 15+ (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Framer Motion
*   **Icons**: Lucide React
*   **Authentication**: Supabase Google OAuth
*   **Database**: Supabase (PostgreSQL)
*   **State Management**: Zustand
*   **Monitoring**: Sentry (Errors) & GitHub Actions (CI)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- Supabase Project
- Google Cloud Project (for OAuth)
- Sentry Project (Optional, for error tracking)

### 2. Environment Variables
Create a `.env.local` file in this directory and populate it with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id

# Admin configuration
ADMIN_EMAILS=admin@gjanandsarkar.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 3. Installation
```bash
npm ci
```

### 4. Running for Development
```bash
npm run dev
```

## 📁 Project Structure

*   `src/app`: Page components and API routes.
*   `src/components`: Reusable UI elements (`shared`, `admin`, `ui`, `checkout`, `discovery`).
*   `src/lib`: API clients, database singletons, pricing algorithms, and rate-limiters.
*   `src/store`: Client-side state management.
*   `public`: Static assets and images.
