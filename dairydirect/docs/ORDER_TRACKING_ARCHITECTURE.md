# Order Tracking Architecture (Phase 8)

## Overview

The Phase 8 post-purchase redesign drastically improves post-purchase confidence by providing users with clear, actionable order tracking. The architecture relies on reusing the existing `orders` table without backend schema changes, instead tapping into Supabase's powerful nested relational queries.

## Tracking Flow

1. **Checkout Complete** -> `OrderConfirmedScreen`
   - Instantly shows the new Order ID.
   - Clears local checkout state (address, payment).
   - Provides a direct link to `TrackingPage`.
2. **Active Tracking** -> `TrackingPage`
   - Loads the order using the updated `getOrderById`.
   - Displays the map, status timeline, delivery address, and the items purchased.
   - Includes a "Reorder" CTA that pushes the items back into the local cart state and redirects to the cart page.

## Component Map

### `src/lib/api/orders.ts`
The data access layer was updated to fetch relationships natively:
```typescript
.select('*, order_items(*, products(name, image_url), product_variants(weight)), user_addresses(*)')
```
This enables the UI to render rich product information and delivery addresses without making secondary API calls or altering the backend schema.

### `OrderStatusTimeline` (`src/components/tracking/OrderStatusTimeline.tsx`)
A linear progression component mapping to the existing enum states:
- `pending` (Order Received)
- `confirmed` (Preparing)
- `out_for_delivery` (Out For Delivery)
- `delivered` (Delivered)

### `OrderItemsReview` (`src/components/tracking/OrderItemsReview.tsx`)
A read-only variant of the cart summary tailored for post-purchase review. It guarantees users can verify their purchase directly from the tracking page.

### `TrackingSkeleton` (`src/components/tracking/TrackingSkeleton.tsx`)
A full-page loading state that structurally mimics the `TrackingPage` to prevent layout shifts during the initial data fetch.

## Reorder Logic
The reorder functionality utilizes the existing Zustand global store. Upon clicking "Reorder", the app maps over `order.order_items` and invokes `addToCart` for each product/variant combo. It avoids creating a complex backend `reorder` API while delivering immediate value to the user.

## Future Real-Time Tracking Notes

Currently, the `TrackingPage` fakes the driver coordinate animation when the order status is `out_for_delivery`.
To implement real-time tracking in the future:
1. Implement a WebSocket connection (e.g., Supabase Realtime) listening to a new `deliveries` table or the `orders` row.
2. The delivery driver app will broadcast `driver_lat` and `driver_lng`.
3. The `TrackingPage` will subscribe to these coordinates and smoothly update the `driverCoords` state variable.
