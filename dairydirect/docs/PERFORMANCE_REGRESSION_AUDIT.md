# Phase 14.1 Performance Regression Audit

## 1. Executive Summary
The transition from Phase 13 to Phase 14 successfully eliminated the data fetching waterfall in `home/page.tsx` (reducing LCP from 61.2s to 37.3s), but the Lighthouse Performance score paradoxically dropped from 47 to 31. This audit confirms that the drop is entirely due to a massive spike in Total Blocking Time (TBT of 2130ms) and the delay of the LCP paint caused by client-side animation wrappers.

## 2. Performance Regression Findings (47 → 31)
- **Improvements**: Moving `home/page.tsx` to a Server Component prevented the browser from waiting for JS before downloading HTML.
- **Regressions (The Drop)**: The introduction of `framer-motion`'s `whileInView` across dozens of `ProductCard` components, combined with `layout.tsx` forcing a massive hydration boundary, caused the main thread to choke (TBT 2130ms).

## 3. Hydration Audit
**Hotspots ranked by impact:**
1. **`src/app/(customer)/layout.tsx`**: Uses `"use client"`. This forces the *entire application tree* into client-side hydration. Every page rendered under `(customer)` must be hydrated by React on the client.
2. **`BuyAgainCarousel.tsx`**: Triggers a `useEffect` on mount that calls `getProducts({ activeOnly: true })`. This forces the client to download, parse, and re-render the entire products JSON immediately after initial hydration.
3. **`ProductCarousel.tsx`**: Renders multiple `motion.div` nodes per carousel.
4. **`Header.tsx` & `BottomNav.tsx`**: Render `NotificationBell` unconditionally, which in turn evaluates `NotificationCenter`.

## 4. JavaScript Bundle Audit (1755 KiB Unused)
The massive unused JS is directly caused by:
- **`framer-motion`**: Imported by `CartDrawer` and `NotificationCenter`. Since these components are statically imported into the `"use client"` `layout.tsx`, `framer-motion` is baked into the initial main bundle, even though both the Drawer and Notification Center are visually hidden until interacted with.
- **Lucide React**: Heavy icon imports that could be optimized.

## 5. TBT Root Cause Analysis (2130ms)
- **Intersection Observers**: `ProductCarousel` uses `whileInView` for every product card. With 3 carousels on the homepage, Framer Motion instantiates 30-50 Intersection Observers during hydration.
- **Expensive Client Fetch**: `BuyAgainCarousel` fires a `useEffect` data fetch.
- **Heavy Mount**: `layout.tsx` is evaluating `CartDrawer` and `NotificationCenter` on every route.

## 6. CLS Root Cause Analysis (0.236)
- **`BuyAgainCarousel`**: It returns `null` while `isLoading` is true. When the `useEffect` completes, it injects a 300px+ tall carousel into the page, violently pushing all subsequent content down.
- **Dynamic Imports**: `TrustSection` and `SocialProof` use generic `<div className="h-64 ... animate-pulse" />` skeletons. The actual rendered height of these components differs from 64 units, causing a layout shift when the chunk resolves.

## 7. LCP Root Cause Analysis (37.3s)
- **The LCP Element**: The first `<Image>` inside the Best Sellers `ProductCarousel`.
- **The Chain**:
  1. HTML is delivered from the server. The `motion.div` wrapping the `ProductCard` has inline styles `opacity: 0` due to `initial={{ opacity: 0 }}`.
  2. The browser downloads the image (thanks to `priority={true}`), but *cannot* paint it because it is transparent.
  3. The browser waits for the JS bundle to download.
  4. React hydrates the app.
  5. Framer Motion initializes Intersection Observers.
  6. The observer triggers, animating `opacity` to 1.
- **Conclusion**: LCP is artificially blocked by JavaScript execution.

## 8. Framer Motion Findings
Framer Motion is the primary bottleneck. It is being overused for simple mount animations (`whileInView`) on elements that should be statically visible. It is also inflating the initial bundle size because interactive overlays (Drawers/Modals) are not dynamically imported.

## 9. Production Readiness Assessment
**NOT READY.** The application cannot move to SEO or production launch.
Google's crawler and users on mid-tier devices will be heavily penalized by the 37s LCP and 2+ seconds of main thread locking. Route protection in a client layout defeats the purpose of Next.js App Router SEO.

## 10. Prioritized Fix Plan

### Priority 1: Rescue LCP & TBT
- **Impact**: Huge. Will fix the 37s LCP and reduce TBT.
- **Fix**: Remove `framer-motion` from `ProductCarousel` and `ProductCard`. Use native CSS `@keyframes` or `transition` for hover effects. If animation is required, do not hide the first 3 items (`opacity: 0`).

### Priority 2: Eliminate Main Bundle Bloat
- **Impact**: High. Removes ~500KB+ of JS from the initial load.
- **Fix**: Use `next/dynamic` to dynamically import `CartDrawer` and `NotificationCenter` so `framer-motion` is only fetched when the user clicks the cart or bell icon.

### Priority 3: Fix CLS & Client Fetching
- **Impact**: High. Fixes layout shifts and reduces network payload.
- **Fix**: Fetch `BuyAgainCarousel` data on the server in `home/page.tsx` and pass it down as props. Give it a proper height skeleton if suspended.

### Priority 4: Architectural Rescue
- **Impact**: Critical for SEO.
- **Fix**: Move route protection (`isAuthRoute`, `router.replace`) out of `src/app/(customer)/layout.tsx` and into a Next.js `middleware.ts`. Convert `layout.tsx` back to a Server Component.

## 11. Files That Must Be Modified
1. `src/components/home/ProductCarousel.tsx`
2. `src/components/discovery/BuyAgainCarousel.tsx`
3. `src/app/(customer)/home/page.tsx`
4. `src/app/(customer)/layout.tsx`
5. `src/middleware.ts` (New file)
6. `src/components/navigation/Header.tsx`
7. `src/components/navigation/BottomNav.tsx`

## 12. Recommended Next Phase
**Phase 14.2: Remediation Execution**. Execute the Prioritized Fix Plan to stabilize Core Web Vitals before proceeding to SEO or Production phases.
