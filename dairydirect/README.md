# 🥛 DairyDirect

> **The Smarter Way to Deliver Dairy**  
> *From Farm Gate to Your Doorstep — Fresh, Direct, Digital.*

DairyDirect is a hyper-local dairy e-commerce platform that lets households and businesses in Ahmedabad subscribe to daily fresh milk delivery and order Paneer, Ghee, and Buttermilk — directly from the manufacturer, with real-time tracking and zero middlemen.

---

## 📌 Table of Contents

- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Who We Serve](#-who-we-serve)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Product Roadmap](#-product-roadmap)
- [Competitive Advantage](#-competitive-advantage)
- [Vision](#-vision)
- [License](#-license)

---

## ❌ The Problem

Local dairy businesses in India run on phone calls, WhatsApp messages, and paper notebooks. This creates:

| Pain Point | Impact |
|---|---|
| Manual daily order calls | Customer forgets → goes without milk |
| Notebook-based subscriptions | Wrong quantities, no records |
| No formal quality complaint channel | Customer gets bad Paneer → silently churns |
| No demand visibility for production | Overproduction = waste, understock = lost sales |
| Paper delivery lists | Disputes with no proof of delivery |
| Manual monthly revenue tallying | Errors, delays, no GST-ready invoices |

---

## ✅ The Solution

DairyDirect digitises the entire dairy supply chain — from subscription to doorstep — with:

- **One-tap subscriptions** that auto-generate delivery orders every morning
- **Live GPS tracking** so customers know exactly when milk arrives
- **OTP-confirmed deliveries** for tamper-proof digital proof
- **Admin dashboard** for real-time demand, revenue, and complaint visibility
- **GST-ready invoices** auto-generated after every order

> *"We are not a marketplace. We are a manufacturer that finally has its own digital front door."*

---

## 👥 Who We Serve

| Customer Type | Need | How DairyDirect Helps |
|---|---|---|
| 🏠 Household | Daily milk, trusted source | One-tap subscription, morning delivery |
| 💼 Working Professional | No time for market visits | 24/7 app ordering, digital payment |
| 🍽️ Restaurant / Dhaba | Bulk Paneer & Ghee, GST invoice | Bulk order flow, scheduled weekly delivery |
| 👴 Elderly / Less Tech-Savvy | Simple UI, COD option | 3-tap order flow, COD support |
| 🧑‍💼 Admin / Dairy Owner | Full business visibility | Live dashboard — orders, revenue, complaints |
| 🛵 Delivery Personnel | Know where to go, confirm without disputes | Route list app, OTP confirmation |

---

## ⚙️ Features

### Customer-Facing

- **🥛 Daily Milk Subscription Engine** — Choose quantity, select Weekly or Monthly plan. System auto-generates orders every morning.
- **🛒 One-Time Product Ordering** — On-demand ordering for Paneer, Ghee, Buttermilk with full cart and checkout experience.
- **🌐 Global Language Localization** — Full application support for **English** and **Hindi**, with persistent user preferences.
- **🔐 Firebase Phone Authentication** — Secure, passwordless login using OTP verification for a seamless mobile experience.
- **📍 Real-Time Delivery Tracking** — Live GPS map of delivery status via Supabase Realtime and Google Maps integration.
- **🚨 Quality Report System** — Dedicated channel for reporting product issues directly to the manufacturer.
- **🔔 Smart Notifications** — Automated updates for order status, subscription renewals, and delivery arrivals.

### Operations & Admin

- **📊 Admin Dashboard** — Live feed of today's orders, active subscriptions, complaints, revenue, and delivery status.
- **📦 Demand Forecasting** — Aggregated subscription data shows tomorrow's exact production requirement today.
- **🗺️ Delivery Route Management** — Delivery app with route-sorted order list, OTP confirmation, and GPS-logged proof of delivery.
- **📋 Subscription Lifecycle Management** — Full history of active, paused, and cancelled subscriptions. Auto renewal reminders 3 days before expiry. Pro-rata billing for mid-month starts.

### Feature Phases

| Feature | Phase |
|---|---|
| Daily Milk Subscription | ✅ MVP |
| One-Time Product Purchase | ✅ MVP |
| Real-Time Delivery Tracking | ✅ MVP |
| Multi-Language (EN/HI) | ✅ MVP |
| Firebase Phone Auth | ✅ MVP |
| Admin Dashboard | ✅ MVP |
| Quality Report System | ✅ MVP |
| Push Notifications | ✅ MVP |
| Subscription Pause / Resume | 🔵 Phase 1 |
| AI Demand Forecasting | 🟠 Phase 2 |
| WhatsApp Bot Ordering | 🟠 Phase 3 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Authentication | Firebase Phone Auth (Next.js + Admin SDK) |
| Real-Time | Supabase Realtime |
| Icons | Lucide React |
| Maps | Google Maps JavaScript API |
---

## 🚀 Getting Started

### 1. Repository Setup
Clone the repository and install all dependencies using the root workspace script:
```bash
npm run install:all
```

### 2. Environment Configuration
Navigate to both `frontend` and `backend` directories and set up your `.env` files based on the `.example` templates provided in each folder.

### 3. Execution Steps

**Start All Services (Development):**
```bash
# Start Backend
npm run dev:backend

# Start Frontend
npm run dev:frontend
```

**Individual Services:**
- **Backend**: Runs on `http://localhost:4000`
- **Frontend**: Runs on `http://localhost:3000`

---

## 🗺️ Product Roadmap

| Phase | Timeline | Key Milestones |
|---|---|---|
| **Phase 0 — Demo** | Week 1–3 | Working prototype. Core flows. Backend APIs + React web UI. |
| **Phase 1 — MVP** | Month 1–4 | Flutter app (Android). Razorpay payments. FCM notifications. 500 subscribers target. |
| **Phase 2 — Growth** | Month 5–8 | Loyalty points, referrals, subscription pause/resume, iOS app, analytics dashboard v2. |
| **Phase 3 — Expand** | Month 9–12 | B2B portal, multi-branch admin, WhatsApp bot, demand forecasting dashboard. |
| **Phase 4 — Scale** | Year 2+ | Multi-city expansion, partner dairy network, AI production planning. |

---

## 🏆 Competitive Advantage

DairyDirect is not another food delivery app. Here's how it compares:

| Capability | DairyDirect | Swiggy/Zomato | Blinkit/Zepto | Local Milkman Apps |
|---|---|---|---|---|
| Daily milk subscription w/ auto-delivery | ✅ Built for this | ❌ No | ❌ No | ⚠️ Basic only |
| 100% own-manufactured products | ✅ Yes | ❌ Third-party | ❌ Multi-brand | ❌ Aggregated |
| Real-time GPS tracking | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Quality complaint + resolution tracking | ✅ Dedicated flow | ⚠️ Generic chat | ⚠️ Generic refund | ❌ No |
| OTP delivery confirmation | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| Subscription-driven demand forecast | ✅ Yes | ⚠️ Partial | ⚠️ Partial | ❌ No |
| Zero platform commission | ✅ 0% | ❌ 25–30% | ❌ Listing fee | ⚠️ Subscription fee |
| Manufacturer owns customer data | ✅ 100% | ❌ Platform owns | ❌ Platform owns | ❌ Platform owns |

### 5 Unfair Advantages

1. **Vertical Integration** — We manufacture every product we sell. No supply chain risk, no quality dilution.
2. **Subscription-First Model** — Predictable demand, automatic retention, recurring revenue.
3. **Zero Commission Structure** — Every rupee goes directly to us. 0% platform tax.
4. **First-Party Data Ownership** — Every customer, every order, every preference — ours.
5. **Hyper-Local Trust** — Existing community trust digitised and scaled. No brand building from scratch.

---

## 🔭 Vision

**12-Month Goal:** DairyDirect is the default dairy management tool for every household in our delivery area — 1,000+ active subscribers, 5 fully digital delivery personnel, zero notebooks.

**3-Year Goal:** Evolve from a single-dairy app to a full-stack dairy commerce platform — multi-city expansion, partner dairy network, B2B hotel/restaurant portal, and AI-driven production planning that reduces milk waste by 30%.

> *"Swiggy built a platform for restaurants. We are building a platform for ourselves — and that is our greatest advantage."*

---

## 📄 License

This project and its documentation are **strictly confidential — for internal and investor use only**.  
© 2026 DairyDirect. All rights reserved.