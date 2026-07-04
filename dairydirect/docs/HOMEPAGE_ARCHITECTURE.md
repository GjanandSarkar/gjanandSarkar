# Homepage Architecture

This document outlines the architecture and composition of the Gjanand Sarkar storefront homepage, introduced in Phase 3. The objective of this architecture is to transition from a generic "dashboard" to a high-conversion, discovery-oriented shopping interface.

## 1. Core Principles
- **Discovery First**: Users should immediately see categories and products without scrolling past massive marketing or account-level banners.
- **Mobile Optimized**: Horizontal scroll carousels dominate the mobile view to minimize vertical fatigue while maximizing product exposure.
- **Modular Sections**: The homepage is composed of entirely modular components, making it trivial to add new sections (e.g., "Trending Near You" or "Festive Offers") in the future.

## 2. Component Map

The homepage (`src/app/(customer)/home/page.tsx`) acts strictly as a data orchestrator. It fetches the products array and passes slices of it to dumb, presentation-only components.

### `<CategorySection />`
- **Location**: `src/components/home/CategorySection.tsx`
- **Responsibility**: Renders quick-access chips/cards for primary catalog filtering.
- **Data Source**: Dynamically extracts unique categories (`Array.from(new Set(products.map(p => p.category)))`). Prevents dead links to empty categories.
- **UX**: Horizontal scroll (`overflow-x-auto`) on mobile, tight grid on desktop.

### `<ProductCarousel />`
- **Location**: `src/components/home/ProductCarousel.tsx`
- **Responsibility**: Reusable section for displaying an array of `ProductWithVariants`.
- **Features**: Takes `title`, `subtitle`, and optional `icon`. Reuses Phase 1's skeleton loader style for seamless hydration. Reuses `ProductCard.tsx` natively.

### `<TrustSection />`
- **Location**: `src/components/home/TrustSection.tsx`
- **Responsibility**: Renders the 4 core pillars of the business (Fresh Daily, Quality Checked, Farm Sourced, Reliable Delivery) in a responsive grid.

### `<SocialProof />`
- **Location**: `src/components/home/SocialProof.tsx`
- **Responsibility**: A lightweight, neutral validation block indicating community trust without hardcoding fabricated metrics.

## 3. Data Strategy
To avoid introducing new API contracts (per Phase 3 rules), the homepage derives all its sections from a single `getProducts({ activeOnly: true })` call:
- **Best Sellers**: Simulated by slicing the first 6 elements of the array.
- **Fresh Today**: Sorted dynamically by `created_at` descending.
- **Categories**: Deduped from the active product list.

## 4. Future Extension Notes
- **Personalization Engine**: A future `/api/home/feed` endpoint can return dynamic sections rather than hardcoding "Best Sellers" and "Fresh Today". `ProductCarousel` is already equipped to handle these arrays perfectly.
- **Banners**: If marketing banners are needed in the future, a `<BannerCarousel />` component should be inserted *between* the Categories and Best Sellers sections, restricted to a maximum height of 160px on mobile to preserve the commerce focus.
