# Customer Dashboard Architecture (Phase 9)

## Overview
The Phase 9 Account Hub redesign shifts the `/profile` page from a static list of navigation links into a dynamic, data-rich "Dashboard". It serves as the central jumping-off point for all post-purchase and account management activities, matching the standard set by modern quick-commerce applications.

## Component Map
The `ProfileScreen` (`src/app/(customer)/profile/page.tsx`) acts as the smart container, fetching all required data concurrently on mount.

1. **`ProfileSummary`**: Displays the user's avatar, name, and phone number. Handles inline name editing and logout logic.
2. **`RecentOrders`**: Ingests the user's `OrderWithItems[]`, slices the top 3, and displays them as interactive cards. Reuses the robust Reorder logic established in Phase 8.
3. **`ActiveSubscriptions`**: Ingests the user's `SubscriptionWithProduct[]`. Displays up to 2 active/paused subscriptions as a quick glance. Links to the dedicated `/subscribe` page for deep management.
4. **`AddressSnippet`**: Finds the user's default address (or first available) and displays it. Encourages the user to add an address if none exist.
5. **`QuickActions`**: A grid of visually distinct buttons for secondary account features like Quality Reports, Language Settings, and Support.

## Reuse Strategy
- **Order Tracking**: The `RecentOrders` component links directly to the `/tracking/[id]` route built in Phase 8, requiring zero duplicated effort.
- **Address Management**: `AddressSnippet` links directly to the existing `/profile/saved-addresses` route.
- **Language Settings**: We reused the exact language modal markup and Zustand actions from the previous profile implementation, keeping localization intact.

## Future Subscription Notes (Phase 10)
- Currently, `ActiveSubscriptions` is a read-only glance.
- In Phase 10, the `/subscribe` route itself will be overhauled. The data shape (`SubscriptionWithProduct`) fetched on the dashboard is already complete, meaning the dashboard component will likely not need to be updated when Phase 10 modifies the deeper subscription management UI.
