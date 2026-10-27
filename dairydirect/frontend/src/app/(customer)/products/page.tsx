import type { Metadata } from 'next';
import { getProductsPage, PRODUCTS_PAGE_SIZE } from '@/lib/api/products.server';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse every verified Indian product on Gjanand Sarkar — one trusted brand per category, delivered across India.',
};

/**
 * Server-rendered product catalogue with server-side pagination and Postgres FTS.
 *
 * Architecture change (Phase 4):
 *
 *   BEFORE: `getCatalog()` fetched up to 500 rows on every request, serialised
 *   them all into the RSC payload, and handed the entire array to a client
 *   component that filtered/sorted in JS.  The user's browser downloaded
 *   potentially hundreds of unused product rows.
 *
 *   AFTER: `getProductsPage()` fetches exactly one page (24 products) using a
 *   Postgres-level LIMIT/OFFSET.  Category, search, sort and price filters are
 *   pushed into the URL as query params; Next.js re-renders this Server
 *   Component on navigation, so each filter change is handled by Postgres —
 *   not by the browser.
 *
 * The client component `ProductsClient` now only manages:
 *   • the mobile filter sheet open/close state (local UI)
 *   • the sort select (pushes ?sort= to URL and triggers a navigation)
 *   • rendering the product grid and pagination bar
 */

/** Cache per-filter-combination for 60 s; bust on any product change. */
export const revalidate = 60;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: 'featured' | 'price_asc' | 'price_desc';
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const category = params.category || undefined;
  const q = params.q || undefined;
  const sort = (params.sort as 'featured' | 'price_asc' | 'price_desc') || 'featured';

  const result = await getProductsPage({
    page,
    category,
    q,
    sort,
    activeOnly: true,
  });

  return (
    <ProductsClient
      initialProducts={result.products}
      page={result.page}
      pageSize={result.pageSize}
      total={result.total}
      hasMore={result.hasMore}
      currentCategory={category}
      currentQ={q}
      currentSort={sort}
    />
  );
}
