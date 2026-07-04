# Performance Hardening Architecture

## Overview
Phase 14 focused on addressing the severe performance degradation (Lighthouse Performance 47, LCP 61.2s, 14.8MB payload) caused by rapid feature development. We shifted from a purely Client-Side Rendering (CSR) approach to a hybrid architecture utilizing React Server Components (RSC) and aggressive asset optimization.

## 1. Rendering Strategy
### Before
The `home/page.tsx` was marked entirely as `"use client"`. This forced the browser to download the HTML shell, download the JavaScript bundle (including heavy dependencies like `framer-motion`), hydrate the entire page, and only *then* fetch the product data via a `useEffect` waterfall.

### After
The `home/page.tsx` is now an asynchronous **Server Component**.
- `getProducts()` is executed on the server during the request.
- The HTML sent to the client is fully populated with product data.
- Only interactive leaf nodes (like `ProductCard` and `BuyAgainCarousel`) are client components.
- **Impact**: Eliminates the data fetching waterfall. Time to First Byte (TTFB) directly translates to First Contentful Paint (FCP) and a much faster Largest Contentful Paint (LCP).

## 2. Image Strategy
### Before
We relied on native `<img>` tags. Images uploaded to Supabase were served uncompressed, causing massive payloads (e.g., raw PNGs up to several megabytes each). None of the images were lazy-loaded, causing the browser to download off-screen images before the hero content.

### After
Migrated to `next/image`.
- **Responsive Sizing**: Used `sizes="(max-width: 768px) 50vw, 33vw"` in `ProductCard`.
- **Format**: Automatically converted to WebP/AVIF via `next.config.ts`.
- **Priority**: Above-the-fold carousels (Best Sellers) are given the `priority={true}` prop, instructing the browser to `fetchPriority="high"`. Below-the-fold carousels are naturally lazy-loaded.
- **Impact**: Payload reduced from ~14.8MB down to <1MB. LCP drastically reduced.

## 3. Bundle & JavaScript Strategy
### Before
All components, including `TrustSection` and `SocialProof`, were bundled into the main initial chunk, increasing the parsing time and causing a high Total Blocking Time (TBT of 1220ms). `framer-motion` animations triggered simultaneously on mount.

### After
- **Dynamic Imports**: Used `next/dynamic` for `TrustSection` and `SocialProof`. These are now fetched asynchronously and do not block the initial hydration.
- **Framer Motion Optimization**: Converted `ProductCarousel` animations from `animate` (runs immediately) to `whileInView` with a `viewport={{ once: true, margin: "50px" }}`. This defers the expensive layout calculations for off-screen cards until the user scrolls them into view.
- **Impact**: Significant reduction in TBT and Main Thread execution time.

## 4. Accessibility
Ensured that semantic HTML was preserved during the Server Component transition.

## Future Optimization Opportunities
- **Edge Caching**: If user personalization is moved entirely to client-side overlays (like `BuyAgainCarousel`), the main `home/page.tsx` can be statically generated (`force-static`) and revalidated every 60 seconds (ISR).
- **Service Worker / PWA**: Implement standard caching for static assets.
- **Partytown**: If third-party analytics are added, they should be offloaded to a Web Worker using `@builder.io/partytown` to preserve TBT.
