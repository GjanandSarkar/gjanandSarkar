# Customer Engagement & Retention Architecture

## Overview
Phase 13 focuses on transforming passive interfaces into active retention mechanisms. Instead of relying solely on the user remembering to reorder, the frontend now provides structured, contextual engagement loops (Notification Center, Subscription Reminders, Profile Gamification, Reorder Carousels).

## Components Map

### 1. Notification Center (`src/components/notifications/`)
- `NotificationBell`: Trigger component residing in `Header` and `BottomNav`. Displays unread badge.
- `NotificationCenter`: Drawer (Desktop) or Full-screen Modal (Mobile) housing the notifications.
- `NotificationItem`: Contextual rows for Orders, Deliveries, Offers, Payments, and System alerts.
- `NotificationEmptyState`: Replaces the empty view with a CTA to explore products.

### 2. Dashboard Engagement (`src/components/profile/`)
- `EngagementBanner`: Visually prominent card encouraging users to complete profiles or setup default addresses. Uses `framer-motion` concepts and CSS filters for a premium feel.
- `RewardsPreview`: Lightweight milestone visualizer (e.g., "50 pts to Free Delivery"). Does not rely on a complex backend state right now, but establishes the UI space for future loyalty integrations.

### 3. Subscription Retention (`src/components/subscribe/`)
- `SubscriptionReminderCard`: Placed above active subscriptions to remind users of upcoming deliveries and prompt them to "Add Extra Items", driving Average Order Value (AOV) on existing recurring orders.
- Enhanced Empty State: `subscribe/page.tsx` now leverages the `BuyAgainCarousel` inside its empty state to encourage converting past purchases into subscriptions.

### 4. Reorder Experience (`src/components/discovery/`)
- `BuyAgainCarousel`: Now strategically injected into the `orders/page.tsx` directly above the order list. This ensures users landing on "My Orders" can immediately add to cart without navigating to past order details.

## Future Backend Integration Hooks

1. **Push Notifications**: 
   - Add a Service Worker to subscribe to push notifications.
   - Map payload to `NotificationData` interface in `NotificationItem.tsx`.
2. **Loyalty System**:
   - `RewardsPreview.tsx` can be wired to a `GET /api/user/rewards` endpoint.
   - Points balance and progress bar can dynamically reflect actual backend metrics.
3. **Email/SMS Triggers**:
   - The interactions in `SubscriptionReminderCard` (e.g., Add Extra Items) could be mirrored in SMS deep links (e.g., "Reply YES to add Ghee to tomorrow's delivery").

## Performance & Accessibility Decisions
- **Mobile-First**: Notification Center uses a fluid, spring-animated `framer-motion` modal on mobile for thumb-friendly interaction, while defaulting to a side-drawer on Desktop.
- **Lightweight State**: Notification items currently use local state, avoiding complex Redux/Zustand hydration overhead until a real API is present.
- **A11y**: `aria-label` used on notification bells. Clear focus states maintained via `focus-visible:ring-primary`.
- **CSS over JS**: Premium effects (like the engagement banner blobs) use pure CSS gradients and `blur-2xl` instead of heavy WebGL or Canvas rendering.
