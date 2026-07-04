# Smart Commerce Architecture

## Overview
This document outlines the architecture and strategy for the Phase 11 Smart Commerce implementation. The primary goal of this phase was to increase AOV, conversion, and retention through intelligent UX patterns, entirely powered by existing frontend data and logic (without modifying the backend schema or introducing AI APIs).

## Component Map

### Discovery Modules (`src/components/discovery/`)
- **`BuyAgainCarousel.tsx`**: A horizontal product carousel injected into the `HomeScreen` and `ProfileScreen`. It queries the user's order history, flattens the purchased items, counts their frequencies, and displays the top 8 most frequently purchased products.
- **`CartCrossSells.tsx`**: Injected into the `CartDrawer`. It uses a simple client-side rule engine to evaluate the categories present in the cart and recommends complementary products (e.g., Milk -> Paneer, Curd -> Ghee). If the cart is empty, it acts as a "Trending Items" fallback by displaying the first 4 best-selling products.
- **`RelatedProducts.tsx`**: Rendered at the bottom of the `ProductDetailScreen`. It queries all products in the same category as the active product (excluding the active product) and displays them to keep users engaged in discovery.
- **`SubscriptionUpsellBanner.tsx`**: Rendered on the `ProductDetailScreen` specifically for `Milk` products. It serves as a direct CTA to convert one-time buyers into recurring subscribers ("Save 5% with daily morning delivery").
- **`SmartBadges.tsx`**: A reusable utility component for rendering semantic badges (`Best Seller`, `Popular`, `Trending`, `Frequently Reordered`) on product cards and detail pages.

## Personalization Strategy
Personalization is achieved by leveraging the `useStore` Zustand state and existing API wrappers:
1. **User Context**: Modules like `BuyAgainCarousel` explicitly check if a user is authenticated. If they are, they fetch past orders and compute a personalized frequency map.
2. **Cart Context**: `CartCrossSells` actively listens to the `cart` state to dynamically adjust recommendations based on what the user is currently considering.

## Reuse Strategy
To adhere to the strict 15-file budget constraint and maintain visual consistency:
- The existing `ProductCarousel` component was reused for the `BuyAgainCarousel` and `RelatedProducts` modules.
- The existing `ProductCard` component was augmented to support `SmartBadges` rather than creating a new variation of the card.
- No new API endpoints were created; instead, existing `getProducts` and `getUserOrders` fetches were composed together.

## Future AI Integration Notes
While this phase deliberately avoided ML/AI infrastructure, the UI shells are perfectly positioned for future AI integration:
- The rule engine in `CartCrossSells` can be replaced with a real-time collaborative filtering API (e.g., "Users who bought X also bought Y").
- The frequency map in `BuyAgainCarousel` can be replaced with an ML model that predicts *when* a user is likely to run out of a product based on their consumption velocity.
- The `RelatedProducts` array can be populated by a vector similarity search instead of simple category matching.
