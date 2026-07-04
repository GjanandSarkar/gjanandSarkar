# Cart Experience Architecture

This document outlines the architecture and composition of the Gjanand Sarkar Cart experience, transitioned in Phase 5 from a traditional isolated page to a fluid, persistent drawer-based commerce flow.

## 1. Core Principles
- **Persistent Visibility**: Users must always know the state of their cart without navigating away from the shopping context.
- **Zero Calculation Duplication**: Cart totals, delivery fees, and progress logic should be computed centrally.
- **Drawer First, Page Second**: The primary interaction is via the `CartDrawer`. The `cart/page.tsx` acts purely as a direct-link fallback, using the exact same components.

## 2. Component Map

### `useCartDetails` (The Data Layer)
- **Location**: `src/hooks/useCartDetails.ts`
- **Responsibility**: Listens to the Zustand `cart` store and fetches product data to compute the precise subtotal, total items, and delivery fee rules. All UI components consume this hook.

### `<FloatingCartBar />`
- **Location**: `src/components/cart/FloatingCartBar.tsx`
- **Responsibility**: A global, sticky CTA that renders at the bottom of the screen (above the BottomNav on mobile) whenever `totalItems > 0`. 
- **Behavior**: Clicking it opens the `CartDrawer`.

### `<CartDrawer />`
- **Location**: `src/components/cart/CartDrawer.tsx`
- **Responsibility**: A globally injected `AnimatePresence` modal.
- **Behavior**: Slides in from the Right on desktop screens, and from the Bottom on mobile screens. It renders the cart items and `OrderSummary`, and automatically closes if the user routes to `/checkout`.

### `<OrderSummary />` & `<EmptyCart />`
- **Responsibility**: Reusable presentation components that abstract away the layout for bill details and empty states, ensuring perfect consistency between the Drawer and the fallback Page.

## 3. Integration (`layout.tsx`)
The `FloatingCartBar` and `CartDrawer` are injected directly into `src/app/(customer)/layout.tsx`. This ensures they survive page navigations (e.g., from Home to Products) without unmounting, allowing for smooth persistent animations.

## 4. Future Checkout Notes
- Currently, clicking "Proceed to Checkout" from the drawer routes to `/checkout/address`.
- In a future phase, the Checkout flow itself could be converted into a sliding Drawer or a highly optimized single-page application to further reduce friction.
