# Authentication & Checkout Gating Architecture

This document defines the authentication philosophy and routing strategy for the Gjanand Sarkar commerce platform, implemented in Phase 6.

## 1. Core Philosophy: Commerce-First Authentication
Authentication must **never** block product discovery or cart curation. It is treated exclusively as a requirement for *transaction completion* and *account management*, rather than a prerequisite for platform usage.

## 2. Route Matrix

### Guest Routes (No Authentication Required)
These routes are explicitly whitelisted in the global layout guard (`layout.tsx`). Any user, logged in or not, can access them.
- `/home`
- `/products` (and dynamic `/products/[id]`)
- `/categories` (and dynamic `/categories/[id]`)
- `/search`
- `/cart`
- `/tracking/[id]`

### Protected Routes (Authentication Required)
If an unauthenticated user attempts to access these, they are securely redirected to `/login`.
- `/checkout/*`
- `/profile/*`
- `/orders/*`
- `/subscribe/*`
- `/admin/*` (Strict Admin-only)

## 3. The `next` Parameter Lifecycle (Shopping Context Preservation)

To ensure users never lose their shopping context when prompted to login, the platform uses a resilient return-URL architecture:

1. **Detection**: `layout.tsx` detects a guest accessing a protected route (e.g., `/checkout/address`).
2. **Interception**: It redirects the user to `/login?next=/checkout/address`.
3. **Authentication**: `login/page.tsx` extracts the `next` param and passes it directly into the Supabase OAuth `redirectTo` configuration.
4. **Processing**: After Google OAuth, the user lands at `auth/callback/page.tsx`.
5. **Onboarding Evaluation**:
   - If the user has existing addresses, they are redirected seamlessly to the `next` URL (`/checkout/address`).
   - If the user is brand new (no addresses), they are redirected to `/onboarding/address?return_to=/checkout/address`. 
6. **Completion**: Once the user adds an address, they are pushed back to the `return_to` URL, flawlessly resuming their checkout flow.

## 4. Root Route (`/`) Strategy
The root route serves purely as a traffic director.
- Admin users are routed to `/admin`.
- All other users (Guest and Authenticated) are instantly routed to `/home`.
- The legacy forced-onboarding logic has been removed to prioritize immediate product discovery.
