# Subscription Stabilization Architecture

This document outlines the architectural fixes applied during Phase 20.2 to stabilize the Subscription Commerce flow.

## 1. Subscription Workflow
The overarching flow involves creating, viewing, and modifying recurring product deliveries. To ensure security and state consistency:
- Subscriptions are inserted directly via the API wrapper (`createSubscription`), passing through a secure API route (`/api/subscriptions`).
- Date and Time selections are unified into a single ISO string before dispatch, seamlessly storing into the native `start_date` column in the database. 
- Modification reports (for changing volume or plan) follow the same authorization pattern without bypassing RLS.

## 2. Pricing Logic
A crucial disconnect in the UI was linking the layout's rendering state with the checkout state.
- **Monthly Card Display:** The UI now relies on a static 30-day projection calculation with the 5% discount hardcoded into its display `dailyCost * 30 * 0.95`. This guarantees the card always shows the actual monthly price regardless of the user's current selection.
- **Checkout Total:** The variable `total` dynamically recalculates based on the user's selected state (Weekly vs. Monthly) and correctly drives the final checkout button text and pricing validation.

## 3. Authorization Flow
The application strictly relies on Supabase Row Level Security (RLS) for data integrity. The initial implementation failed because it made raw `fetch` calls to protected endpoints without forwarding the user's Next.js Session token.
- **Fix:** We abstracted all network calls through the pre-configured `client.ts` layer.
- **Result:** API routes accurately construct the JWT via `getAuthUser(request)` and the backend rejects truly unauthenticated requests while smoothly authorizing active sessions.

## 4. Discovery Flow
Subscriptions suffered from poor discoverability.
- A dedicated **Subscribe & Save 5%** banner was added natively to the homepage (`/home`), styled with premium visual elements.
- The banner intelligently routes directly into the `/subscribe/new` checkout pipeline, leveraging the existing product array without needing duplicate database schemas or dedicated "Subscription Products" tables.

## 5. Known Limitations
- The current schema (`subscriptions`) utilizes a single `start_date` timestamp. To decouple Delivery Date from Delivery Time (e.g. for filtering exact delivery blocks in the Admin UI), a future schema migration to add `delivery_time_slot` might be beneficial, but the current ISO combining approach circumvents the need for schema changes in Phase 20.2.
