/**
 * GET /api/ads
 *
 * Fills a promotional slot. Returns the campaign plus the products to render,
 * or an empty list when nothing relevant is eligible.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { serveAds, type AdPlacement } from '@/lib/ads/serving';
import { getAdminSupabase } from '@/lib/supabase/admin';

const PLACEMENTS: AdPlacement[] = ['home', 'product', 'category', 'cart', 'search'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const placementParam = searchParams.get('placement') as AdPlacement | null;
    const placement: AdPlacement =
      placementParam && PLACEMENTS.includes(placementParam) ? placementParam : 'home';

    const sessionId = searchParams.get('sessionId') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const auth = await getAuthUser(request).catch(() => null);
    const category = searchParams.get('category');

    const ads = await serveAds({
      placement,
      sessionId,
      userId: auth?.userId ?? null,
      category,
      limit: 1,
    });

    if (!ads.length) return NextResponse.json({ ads: [] });

    const sb = getAdminSupabase();

    // Resolve the promoted products. A campaign may name products explicitly
    // or promote a whole category.
    const enriched = await Promise.all(
      ads.map(async (ad) => {
        const select =
          'id, name, category, image_url, brand, product_variants(id, weight, price, original_price, stock)';

        let query = sb.from('products').select(select).eq('is_active', true).limit(4);

        if (ad.productIds.length) {
          query = query.in('id', ad.productIds);
        } else if (category) {
          query = query.eq('category', category);
        }

        const { data } = await query;

        // Never promote something nobody can buy.
        const products = (data ?? []).filter((p: any) =>
          (p.product_variants ?? []).some((v: any) => Number(v.stock) > 0)
        );

        return { ...ad, products };
      })
    );

    // Drop campaigns whose products are all out of stock rather than
    // rendering an empty promo box.
    return NextResponse.json({ ads: enriched.filter((a) => a.products.length > 0) });
  } catch (err: any) {
    console.error('[Ads GET] Error:', err?.message);
    return NextResponse.json({ ads: [] });
  }
}

export const dynamic = 'force-dynamic';
