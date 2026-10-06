import { unstable_cache } from 'next/cache';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { CatalogProduct } from '@/lib/types/catalog';

/**
 * Slim product shape for the homepage.
 *
 * The homepage used to call `getProductsServer()`, which runs
 * `select('*, product_variants(*)')` over the ENTIRE active catalogue with no
 * limit, on every single request (`force-dynamic` + `revalidate = 0`). Every
 * column of every product and every variant — descriptions, cost prices,
 * audit columns — was then serialised into the RSC payload and shipped to the
 * browser, even though the homepage renders at most ~20 cards and reads 6
 * fields.
 *
 * This type is the actual read set. Keeping it narrow shrinks the DB result,
 * the server render time, and the HTML/flight payload all at once.
 */
export type HomeProduct = CatalogProduct;

/** How many products the homepage actually renders across all its sections. */
export const HOME_FEED_LIMIT = 24;

async function fetchHomeFeed(): Promise<HomeProduct[]> {
  try {
    const admin = getAdminSupabase();

    const { data, error } = await admin
      .from('products')
      // Explicit column list instead of `*` — no description/cost_price/etc.
      .select(
        'id, name, category, image_url, product_variants(id, weight, price, original_price, stock, available_quantity)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(HOME_FEED_LIMIT);

    if (error) throw error;
    return (data ?? []) as HomeProduct[];
  } catch (error) {
    console.error('[home] getHomeFeed failed:', error);
    // The homepage must still render (hero, trust bar, banners) if the DB is
    // slow or down. Returning [] degrades instead of throwing a 500.
    return [];
  }
}

/**
 * Cached homepage feed.
 *
 * The catalogue changes when an admin/seller edits a product — not on every
 * page view. We cache the result for 5 minutes and additionally tag it, so
 * product mutations can call `revalidateTag('products')` for an instant,
 * correct refresh rather than waiting for the TTL.
 *
 * Net effect: the common case serves the homepage with zero database
 * roundtrips instead of one full-catalogue query per visitor.
 */
export const getHomeFeed = unstable_cache(fetchHomeFeed, ['home-feed-v1'], {
  revalidate: 300,
  tags: ['products', 'home-feed'],
});
