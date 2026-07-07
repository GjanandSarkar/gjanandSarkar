# Commerce UX Stabilization Architecture

## Overview
This document covers the architectural and UI/UX decisions made during Phase 20.3 (Commerce UX Stabilization) for Gjanand Sarkar. The focus was on fixing responsive behaviors, component logic, and hydration mismatches across the customer platform.

## Stabilized Components

### 1. Admin Login Redirect (`auth/callback/page.tsx`)
- **Problem:** All logins were unconditionally routed to `/home` before the global layout detected an admin role and redirected to `/admin`, causing a brief homepage flash.
- **Solution:** We now extract the `role` directly from the `/api/auth/sync` JSON payload and immediately set `redirectTarget = '/admin'` if the user is an admin, completely bypassing the customer homepage.

### 2. Phone Number Collection (`ProfileSummary.tsx` & `api/auth.ts`)
- **Problem:** Phone numbers were statically displayed, and the API lacked the update method.
- **Solution:** Introduced `updateProfilePhone` to `src/lib/api/auth.ts` and added an inline edit state to `ProfileSummary.tsx`. Uses Framer Motion for smooth transitions between the read/write states.

### 3. Address Selector (`LocationSelector.tsx`)
- **Problem:** Hardcoded dummy text was displayed in the global header.
- **Solution:** Connected `LocationSelector` directly to `useStore`. It now reads `user.saved_addresses` and allows the user to switch the active `checkoutAddressId` via a custom dropdown menu. The selection is globally persisted.

### 4. Notification Drawer (`NotificationCenter.tsx`)
- **Problem:** Responsive rendering relied on a Javascript `isMobile` check from `useMediaQuery`, which conflicted with Tailwind's `md:hidden` classes. This caused the component to hide itself completely on certain breakpoints or during hydration.
- **Solution:** Removed Javascript-based media queries (`isMobile`) from `NotificationBell.tsx`. The `NotificationCenter` now renders both the bottom sheet (mobile) and the right drawer (desktop) simultaneously, relying purely on robust Tailwind CSS media queries (`md:hidden` and `hidden md:block`) to display the correct DOM element.

### 5. Cart Quantity Feedback (`ProductCard.tsx`)
- **Problem:** When a product with multiple variants was added to the cart, the inline quantity adjuster replaced the quantity with a dot (`·`).
- **Solution:** Replaced the dot with the aggregated `totalQuantity` across all variants of that product. This provides users with clear feedback on how many total items of that specific product they have in their cart.

### 6. Global Cart Total (`CartButton.tsx`)
- **Problem:** The header cart summary button had a hardcoded `₹ --` placeholder.
- **Solution:** Integrated the existing `useCartDetails()` hook into the `CartButton` to dynamically compute and display the `subtotal` from the cart store.

### 7. Product Hero Images (`ProductClient.tsx`)
- **Problem:** The main product image used `object-cover`, causing aggressive cropping depending on the aspect ratio of the viewport.
- **Solution:** Replaced with `object-contain p-4 bg-surface-container-lowest` so the entire image is guaranteed to be visible without distortion or loss of important package details.

## Next Steps
With the core UX stabilized, the platform is now highly polished across both mobile and desktop viewports. The next logical phases are configuring standard product inventory and setting up the final payment gateways.
