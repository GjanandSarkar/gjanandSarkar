# Business Intelligence & Analytics (Phase 21)

## Overview
Phase 21 successfully transformed the Admin Dashboard from a simple management interface into a real-time Business Intelligence (BI) Platform. Instead of integrating third-party vendors or duplicating reporting tables, we developed a highly efficient, client-side aggregation engine powered directly by production database records (Supabase).

## Architecture & Data Layer
- **No N+1 Queries**: Created `getBusinessIntelligence()` in `src/lib/api/analytics.ts` which executes just 3 highly targeted queries for `orders`, `profiles`, and `subscriptions`.
- **In-Memory Aggregation**: Rather than relying on slow, complex backend aggregations or introducing a heavy backend dependency, the raw operational datasets are retrieved as lean projections and aggressively memoized via `useMemo` in the browser. 
- **Zero-Dependency Charts**: Eliminated the need for heavy charting libraries (like Recharts) by building `<SimpleBarChart>` and `<HorizontalBarChart>` completely natively using Tailwind CSS and DOM nodes. This keeps bundle sizes minimal.

## KPI Definitions & Calculations

### 1. Revenue Analytics
- **Total Revenue:** Sum of `total_amount` for all `orders` where `status != 'cancelled'`.
- **Revenue Today / Week / Month:** Sum of `total_amount` where the `created_at` timestamp falls within the respective `date-fns` time boundary.

### 2. Customer Analytics
- **Total Customers:** Count of all registered `profiles`.
- **Repeat Customers:** Distinct `user_id`s in the `orders` table who have placed > 1 order.
- **New Customers:** `Total Customers - Repeat Customers`.

### 3. Product Analytics
- **Top Selling Products:** Sorted aggregate of `quantity` purchased for each distinct `product.name` found inside `order_items`.
- **Highest Revenue Products:** Sorted aggregate of `(quantity * price)` for each distinct `product.name` found inside `order_items`.

### 4. Operational KPIs
- Funnel visualization based strictly on real-time `status` column mapping: `pending` -> `confirmed` -> `out_for_delivery` -> `delivered` -> `cancelled`.

## Known Limitations
1. **1000-Row Limit**: Supabase's JS Client imposes a default maximum of 1,000 rows returned per `.select()` query. For an MVP and standard operational velocity, this is sufficient. However, as order volume scales past 1,000, older records will fall out of the calculation window.
2. **Mitigation Path**: Once volume exceeds 1,000 orders, we must implement a **PostgreSQL RPC (Remote Procedure Call)** via Supabase. This will execute the aggregations natively on the database server, bypassing client-side memory constraints and data transfer limits entirely.

## Recommended Next Phase
- **Phase 22 (Notifications & Retargeting):** Introduce automated email/SMS communication (via Supabase Edge Functions or Resend) for abandoned carts, subscription renewals, and delivery updates.
