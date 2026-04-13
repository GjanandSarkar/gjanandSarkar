# 🖥️ DairyDirect Frontend — Next.js 15 App

The frontend for DairyDirect is a high-performance, mobile-first web application built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. It serves as the primary interface for both customers and administrators.

## ✨ Core Features

*   **📱 Mobile-First Design**: Responsive UI optimized for mobile devices with professional Lucide icons.
*   **🔐 Firebase Phone Auth**: Seamless OTP-based login using Firebase Authentication.
*   **🌐 Multi-Language Support**: Complete localization in **Hindi** and **English**, persisting across sessions.
*   **📦 Subscription Dashboard**: Real-time tracking of active milk plans and upcoming deliveries.
*   **🛒 Shopping Experience**: Full E-commerce flow for products like Ghee, Paneer, and Buttermilk.
*   **🛰️ Real-Time Tracking**: Delivery tracking powered by Google Maps and Supabase Realtime subscriptions.
*   **🛡️ Admin Portal**: Advanced management interface for orders, products, and user subscriptions.

## 🛠️ Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Authentication**: Firebase Phone Auth
*   **Database/Realtime**: Supabase
*   **State Management**: Zustand / React Context

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- Firebase Project
- Supabase Project

### 2. Environment Variables
Create a `.env.local` file in this directory and populate it with your credentials:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Installation
```bash
npm install
```

### 4. Running for Development
```bash
npm run dev
```

## 📁 Project Structure

*   `src/app`: Page components and API routes.
*   `src/components`: Reusable UI elements (shared, admin, ui).
*   `src/lib`: API clients (Supabase, Firebase) and utility functions.
*   `src/store`: Client-side state management.
*   `public`: Static assets and images.
