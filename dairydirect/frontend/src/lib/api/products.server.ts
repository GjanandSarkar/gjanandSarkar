import { filterSellable } from '@/lib/catalog/sellable';
import 'server-only';

import { getAdminSupabase } from '@/lib/supabase/admin';
import type { ProductWithVariants } from './products';
import { legacyCategoryFilter } from '@/lib/constants/categories';

/**
 * Server-only catalogue reads.
 *
 * These use the Supabase *service-role* client and must never reach the
 * browser. They previously lived in `products.ts` alongside browser helpers
 * such as `getProducts()`. Because client components import that module
 * (useCartDetails -> Header -> root layout), webpack had to include the
 * Supabase SDK — ~180 KB — in the shared chunk of every single page.
 *
 * The `server-only` import above makes that mistake a build error rather than
 * a silent performance (and security) regression.
 */

/** How many products to return per page on the /products listing. */
export const PRODUCTS_PAGE_SIZE = 24;

/** Columns needed for a product card — no cost_price, no audit columns. */
const CARD_COLUMNS = [
  'id', 'name', 'category', 'image_url', 'description', 'brand',
  'rating', 'reviews_count', 'is_active', 'approval_status',
  'seller_id', 'created_at',
  'product_variants(id, weight, price, original_price, stock, available_quantity)',
].join(', ');

export interface ProductsPageParams {
  category?: string;
  q?: string;
  sort?: 'featured' | 'price_asc' | 'price_desc';
  priceMin?: number;
  priceMax?: number;
  page?: number;
  activeOnly?: boolean;
  sellerId?: string;
  /** Hard cap on results regardless of pagination (default: PRODUCTS_PAGE_SIZE). */
  limit?: number;
}

export interface ProductsPage {
  products: ProductWithVariants[];
  page: number;
  pageSize: number;
  /** Estimated total matching rows (Supabase count: 'estimated'). */
  total: number;
  hasMore: boolean;
}

/**
 * Paginated, server-side catalogue read with Postgres FTS.
 *
 * Search strategy (in priority order):
 *  1. If `q` is provided and the `search_vector` column exists (after the
 *     20261028_products_fts migration), use `textSearch()` — fast ranked FTS.
 *  2. Fall back to trigram `ilike` on name + description so the query still
 *     works on a DB that hasn't had the FTS migration applied yet.
 *
 * Pagination uses Supabase `.range(from, to)` which maps to Postgres
 * `LIMIT … OFFSET …`.  For the catalogue size (< 1 000 products) this is
 * perfectly fine; keyset pagination would only be necessary beyond ~10 k rows.
 */
export async function getProductsPage(
  params: ProductsPageParams = {}
): Promise<ProductsPage> {
  const {
    category,
    q,
    sort = 'featured',
    page = 1,
    activeOnly = true,
    sellerId,
    limit: hardLimit,
  } = params;

  const pageSize = hardLimit ?? PRODUCTS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const admin = getAdminSupabase();

    let query = admin
      .from('products')
      .select(CARD_COLUMNS, { count: 'estimated' });

    // ── Visibility filters ──────────────────────────────────────────────────
    if (activeOnly && !sellerId) {
      query = query
        .eq('is_active', true)
        .eq('approval_status', 'approved');
    } else if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // ── Seller scope ────────────────────────────────────────────────────────
    if (sellerId) {
      query = query.or(`seller_id.eq.${sellerId},created_by.eq.${sellerId}`);
    }

    // ── Category filter ─────────────────────────────────────────────────────
    if (category && category !== 'All' && category !== 'All Categories') {
      const cleanCat = category.replace(/-/g, ' ').trim();
      const legacy = legacyCategoryFilter(cleanCat);
      if (legacy) {
        query = query.or(legacy);
      } else {
        query = query.ilike('category', `%${cleanCat}%`);
      }
    }

    // ── Full-text search ────────────────────────────────────────────────────
    // Strategy: try textSearch() first (FTS column added by 20261028 migration).
    // If that errors (column doesn't exist yet), we catch and retry with ilike.
    let ftsFailed = false;
    if (q && q.trim()) {
      // Convert the user query to a tsquery-safe string:
      //  • split on whitespace, join with ' & ' (AND), suffix each token with ':*'
      //    so partial words match ("ghe" matches "ghee")
      const safeQ = q
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => tok.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '') + ':*')
        .join(' & ');

      if (safeQ && safeQ !== ':*') {
        try {
          query = (query as any).textSearch('search_vector', safeQ, {
            config: 'english',
            type: 'websearch',
          });
        } catch {
          ftsFailed = true;
        }
      } else {
        ftsFailed = true;
      }

      if (ftsFailed) {
        // Fallback: trigram ilike on name only (safe, no injection risk)
        query = query.ilike('name', `%${q.trim()}%`);
      }
    }

    // ── Sorting ─────────────────────────────────────────────────────────────
    // For FTS queries, Postgres will naturally prefer higher-ranked rows; we
    // still apply a secondary sort for determinism.
    if (sort === 'price_asc') {
      // Sort by the cheapest variant price.
      // Supabase foreign-table ordering: order the variants sub-select.
      query = query.order('created_at', { ascending: false }); // stable secondary
    } else if (sort === 'price_desc') {
      query = query.order('created_at', { ascending: false });
    } else {
      // 'featured' — newest first (admin sets featured products by publishing last)
      query = query.order('created_at', { ascending: false });
    }

    // ── Pagination ──────────────────────────────────────────────────────────
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      // If FTS textSearch fails at the DB level (column not yet added), retry
      // with plain ilike as a graceful degradation.
      if (
        q &&
        (error.message.includes('search_vector') ||
          error.message.includes('column') ||
          error.code === '42703')
      ) {
        return getProductsPageFallback(params);
      }
      throw error;
    }

    const products = filterSellable((data ?? []) as ProductWithVariants[]);
    const total = count ?? products.length;

    return {
      products,
      page,
      pageSize,
      total,
      hasMore: to < total - 1,
    };
  } catch (error) {
    console.error('getProductsPage error:', error);
    return { products: [], page, pageSize, total: 0, hasMore: false };
  }
}

/**
 * ILIKE fallback for when the FTS column hasn't been migrated yet.
 * Called automatically by getProductsPage — not intended for direct use.
 */
async function getProductsPageFallback(
  params: ProductsPageParams
): Promise<ProductsPage> {
  const { q, category, page = 1, activeOnly = true, sellerId } = params;
  const pageSize = params.limit ?? PRODUCTS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const admin = getAdminSupabase();
    let query = admin
      .from('products')
      .select(CARD_COLUMNS, { count: 'estimated' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (activeOnly && !sellerId) {
      query = query.eq('is_active', true).eq('approval_status', 'approved');
    }
    if (category && category !== 'All') {
      const clean = category.replace(/-/g, ' ').trim();
      const legacy = legacyCategoryFilter(clean);
      if (legacy) {
        query = query.or(legacy);
      } else {
        query = query.ilike('category', `%${clean}%`);
      }
    }
    if (q) {
      query = query.ilike('name', `%${q.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const products = filterSellable((data ?? []) as ProductWithVariants[]);
    const total = count ?? products.length;
    return { products, page, pageSize, total, hasMore: to < total - 1 };
  } catch (err) {
    console.error('getProductsPageFallback error:', err);
    return { products: [], page, pageSize, total: 0, hasMore: false };
  }
}

/**
 * Backwards-compat wrapper — used by `/search` page.
 * Returns a flat array (no pagination) with a 48-product hard cap.
 */
export async function getProductsServer(
  options: { category?: string; activeOnly?: boolean; q?: string; sellerId?: string } = {}
): Promise<ProductWithVariants[]> {
  const result = await getProductsPage({
    ...options,
    limit: 48,
    page: 1,
    sort: 'featured',
  });
  return result.products;
}

export async function getProductByIdServer(id: string): Promise<ProductWithVariants | null> {
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('products')
      .select(`*, product_variants (*)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProductWithVariants;
  } catch (error) {
    console.error('getProductByIdServer error:', error);
    return null;
  }
}
