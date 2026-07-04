# SEO & Organic Discovery Architecture

## Executive Summary
Phase 15 transitioned Gjanand Sarkar from a client-side dependent React application to a robust, search-engine-friendly commerce platform. By strategically moving critical discovery paths to React Server Components (RSC), we unlocked native metadata generation, structured data, and canonical URLs without regressing the performance gains achieved in Phase 14.

## 1. Technical SEO Strategy

### Server-Side Rendering (SSR) for Discovery
- **Product Pages (`/products/[id]`)**: Migrated to Server Components. Crawlers now receive fully-formed HTML containing the product title, description, and price immediately on request. Client-side interactivity (Add to Cart, Variants) was extracted into a lightweight `<ProductClient />` component.
- **Category Pages (`/categories/[category]`)**: Created dedicated, indexable category routes to capture high-intent organic search queries (e.g., "Buy Fresh Milk Online"). Previously, categories relied on query parameters (`/products?category=Milk`) handled entirely on the client, rendering them invisible to search engines.

### Metadata Management
- **Dynamic Titles**: Implemented a global title template (`%s | Gjanand Sarkar`) in the root layout.
- **OpenGraph**: Injected OpenGraph tags into Server Components for rich sharing experiences on social media and messaging platforms.

## 2. Structured Data Strategy (JSON-LD)

Structured data translates our content into a machine-readable format that Google understands, making us eligible for Rich Results (like star ratings and price in search results).

- **Organization & WebSite Schema**: Added to the root layout to establish brand authority and enable Google Sitelinks search box.
- **Product Schema**: Injected into `/products/[id]/page.tsx`. Includes the product name, description, image, and an `AggregateOffer` mapping the price ranges of available variants.
- **BreadcrumbList Schema**: Injected into product and category pages to help search engines understand site hierarchy and display breadcrumbs in SERPs.

## 3. Internal Navigation & Discoverability Strategy

### Empty States
We eliminated "dead ends" in the user journey.
- When a search yields no results (`EmptyState.tsx`), the interface now proactively suggests "Popular Categories" (Milk, Paneer, Ghee). This guides users back into the conversion funnel and provides crawlers with highly valuable internal links.

### Category Routing
- Replaced ambiguous query-parameter routing in the `CategorySection` with clean, semantic links (`/categories/Milk`).

## 4. Performance & Accessibility Validation

### Performance Retained
- We avoided using bloated SEO libraries (like `next-seo` or `react-helmet`). All metadata is generated natively using Next.js `generateMetadata`, ensuring zero impact on client bundle size.
- `framer-motion` remains strictly cordoned off from the critical rendering path.

### Accessibility Retained
- Semantic HTML (`<main>`, `<header>`) and properly ordered headings (`<h1>` on category and product pages) naturally improve both accessibility and SEO structure.

## 5. Future Growth Opportunities

1. **Sitemap Generation**: Implement `sitemap.ts` in Next.js to auto-generate a dynamic XML sitemap of all active products and categories.
2. **Robots.txt**: Add a `robots.txt` file to guide crawler behavior and prevent indexing of sensitive areas (like `/profile` or `/checkout`).
3. **Canonical Tags**: As the catalog grows, ensure canonical tags are added to prevent duplicate content penalties (e.g., if a product belongs to multiple categories).
4. **Blog / Content Hub**: Introduce an informational architecture (e.g., `/learn/benefits-of-a2-milk`) to capture top-of-funnel organic traffic.
