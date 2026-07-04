# Navigation Architecture

This document outlines the navigation framework implemented in Phase 2 for the Gjanand Sarkar platform. It has been designed specifically to accommodate a hyperlocal commerce UX (inspired by platforms like Zepto and Blinkit).

## 1. Core Principles
- **Guest-First Browsing**: Users must be able to explore the catalog, search for products, select their delivery location, and build a cart *without* needing to log in. Authentication is deferred strictly to the checkout phase.
- **Top-Down Priority**: The `Header` is the global anchor. It acts as the primary tool for Location and Search globally.
- **Mobile-First Bottom Nav**: On smaller devices, primary wayfinding (Home, Categories, Search, Cart, Account) happens in the `BottomNav` to remain in the thumb zone.

## 2. Component Map

The new navigation components are located in `src/components/navigation/`:

### Global `<Header />`
- The unified responsive top bar (`sticky top-0 z-40`).
- **Desktop Mode**: Displays the Logo, Location Selector, a full-width Search input, Cart button, and Account dropdown.
- **Mobile Mode**: Displays Logo and Profile on the top row, with the Location Selector and Search bar on a secondary row below to maximize tap targets.

### `<LocationSelector />`
- **Purpose**: Displays the current delivery location (or a placeholder prompting selection).
- **Future Integration**: Should trigger a global Location Context drawer/modal that lets the user search via Mapbox/Google Maps or select saved addresses. Currently UI-only.

### `<SearchTrigger />`
- **Purpose**: Replaces inline search logic with a unified trigger button.
- **Future Integration**: Should open a full-screen or modal Search Experience containing recent searches, trending items, and real-time typeahead results from Supabase/Algolia.

### `<CartButton />`
- **Purpose**: A desktop-optimized CTA that reads live quantity/pricing from the Zustand `useStore`.
- **Note**: Works in tandem with the floating `<CartBar />` (which is highly optimized for mobile conversion).

### `<AccountMenu />`
- **Purpose**: Context-aware dropdown trigger. Checks if the user is authenticated; if so, displays their First Name and links to `/profile`. If guest, displays "Login" and links to `/login`.

## 3. Shared `<BottomNav />`
- Refactored away from dashboard-style tabs (Orders/Subscribe) to explicit commerce tabs:
  - `Home` (`/home`)
  - `Categories` (`/categories` -> `/products`)
  - `Search` (`/search`)
  - `Cart` (`/cart`) - Displays live item count badge.
  - `Profile` (`/profile`)

## 4. Route Guard Adjustments
In `src/app/(customer)/layout.tsx`, the strict redirect to `/login` for unauthenticated sessions has been lifted for the following routes:
- `/home`
- `/products`
- `/categories`
- `/search`
- `/cart`
- `/tracking/*`

This fully unlocks the guest browsing experience.

## 5. Technical Debt & Cleanup
- The legacy `Sidebar.tsx` and `TopAppBar.tsx` components were successfully deprecated and removed from the active layout tree, drastically reducing DOM nodes and complexity. They can safely be deleted in future cleanup phases once fully confident.
