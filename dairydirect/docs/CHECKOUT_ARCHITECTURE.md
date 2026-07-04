# Checkout Architecture (Phase 7)

## Overview

The Gjanand Sarkar Checkout Experience was redesigned in Phase 7 to follow a high-velocity, single-page architecture inspired by modern hyperlocal commerce (e.g., Zepto, Blinkit).

The primary goal of this architecture is to minimize friction, reduce cognitive load, and maximize conversion rates by eliminating unnecessary page loads and consolidating the flow.

## Component Map

### 1. `src/app/(customer)/checkout/page.tsx`
The orchestrator component. It handles:
- Fetching user addresses and available products.
- Validating the coupon against the current cart.
- Maintaining the selected `checkoutAddressId`, `selectedMethod`, `selectedSlot`, and `upiId`.
- Invoking the `placeOrder` service.

### 2. `AddressSelection` (`src/components/checkout/AddressSelection.tsx`)
A compact UI that displays the user's saved addresses.
- Reuses existing address API hooks.
- Simplifies slot selection inline.
- Directs users to `/profile/saved-addresses` if none exist.

### 3. `OrderReview` (`src/components/checkout/OrderReview.tsx`)
Addresses the "Order Confidence" conversion principle.
- Provides a highly condensed list of cart items immediately above the pricing summary.
- Users can visually confirm their products and quantities right before pressing "Pay", eliminating the need to return to the Cart Drawer.

### 4. `PaymentSelection` (`src/components/checkout/PaymentSelection.tsx`)
Handles the selection of standard payment methods (UPI, Card, COD).
- Includes inline progressive disclosure (e.g., showing the UPI ID input only when UPI is selected).
- Maintains strict typing and simple prop bubbling to the parent page.

### 5. `OrderSummary` (`src/components/cart/OrderSummary.tsx`)
Reused from Phase 5 (Cart Experience).
- Accurately renders subtotal, delivery fees, and free-delivery progress thresholds.

## Conversion Decisions

- **Single-Page Flow**: Merging `/checkout/address` and `/checkout/payment` prevents the typical 10-15% drop-off seen at multi-page checkout transitions.
- **Trust Indicators**: The header now includes a "100% Safe" badge, and the layout emphasizes security.
- **Sticky CTA**: The "Place Order" button is fixed to the bottom of the screen on mobile, ensuring the user is never more than a tap away from completing their order.
- **Inline Coupon Handling**: The coupon input is placed just above the pricing summary for clear immediate feedback.

## Future Payment Notes

Currently, the payment system relies on simple UI state selection (UPI, Card, COD) before passing the status to the `placeOrder` backend service.

**Next Steps for Payment Gateways (e.g., Razorpay/Stripe):**
1. The `handlePlaceOrder` function inside `checkout/page.tsx` should first hit a `/api/orders/create` endpoint to generate an order ID and a gateway-specific Order ID (e.g., `rzp_order_id`).
2. The UI will then instantiate the gateway's checkout modal (e.g., `new Razorpay(options).open()`).
3. Upon successful callback, a secondary verification endpoint `/api/orders/verify` will confirm the signature and redirect the user to `/order-confirmed/[id]`.
4. The `PaymentSelection` component UI is already decoupled enough that adding a specific gateway integration will only require modifications to `handlePlaceOrder` and not the view hierarchy.
