# Product Discovery Architecture

This document outlines the architecture and composition of the Gjanand Sarkar Product Discovery experience (the Catalog), completely overhauled in Phase 4.

## 1. Core Principles
- **Scannability First**: The catalog must allow users to visually parse large amounts of inventory instantly. This means dense grids, clear price signals, and massive, obvious CTA buttons.
- **2-Column Desktop, 1-Column Mobile**: Aligning with modern commerce UX, desktop users get a persistent vertical category rail on the left, while mobile users get a horizontal thumb-zone scroll on the top.
- **Zero-Latency Interactions**: Filtering (Search + Category + Freshness) happens entirely client-side using a unified hook. No backend round-trips are required once the initial payload is loaded.

## 2. Component Map

### `<CategoryRail />` (`src/components/discovery/CategoryRail.tsx`)
- **Responsibility**: Global category state management.
- **Behavior**: Renders `All` plus dynamically extracted categories. Features a skeleton loading state to prevent layout shift. Renders as a vertical sticky sidebar on desktop, and a horizontal scroll on mobile.

### `<FilterBar />` (`src/components/discovery/FilterBar.tsx`)
- **Responsibility**: Secondary filtering constraints.
- **Features**: Contains the free-text `Search` input and the `Freshness Guarantee` boolean toggle. Returns the visual `ResultCount` back to the user.

### `<EmptyState />` (`src/components/discovery/EmptyState.tsx`)
- **Responsibility**: Graceful degradation when filters return zero results.
- **Features**: Accepts `type="search" | "category" | "products"`. Provides contextual iconography, copy, and a "Clear Filters" CTA.

### `<ProductCard />` (Upgraded)
- **UX Change**: Replaced the subtle `+` icon button with a prominent, full-width `ADD` text button.
- **Why**: Hyperlocal commerce relies heavily on impulse/rapid additions. The `ADD` button increases the tap target significantly and removes ambiguity.

## 3. The Orchestrator (`src/app/(customer)/products/page.tsx`)
The `ProductsScreen` acts as the data provider. It fetches `getProducts({ activeOnly: true })` on mount and stores it in React state.
It uses `useMemo` to chain three filters:
1. `Category` Match (via `<CategoryRail />`)
2. `Search` string Match (via `<FilterBar />`)
3. `Freshness` boolean Match (via `<FilterBar />`)

## 4. Future Search Notes
- **Algolia / Typesense Integration**: Currently, search is a simple client-side `.toLowerCase().includes()` check. When the catalog exceeds ~500 items, this should be offloaded to a dedicated search engine (like Algolia or Supabase pg_vector).
- **Global Search Drawer**: The global `<Header />` (built in Phase 2) currently acts as a passive input. In the future, tapping it should open a full-screen drawer showing trending searches, and upon typing, should fetch real-time predictive results rather than routing to this page immediately.
