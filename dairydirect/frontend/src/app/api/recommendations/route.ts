/**
 * GET /api/recommendations
 *
 * Serves personalised product rails for the homepage, product pages, category
 * pages and the cart. Recommendations are computed live per request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getRecommendations, type Placement } from '@/lib/recommendations/engine';
import { assignRecommendationVariant } from '@/lib/analytics/experiments';

const PLACEMENTS: Placement[] = ['home', 'product', 'category', 'cart'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const placementParam = searchParams.get('placement') as Placement | null;
    const placement: Placement =
      placementParam && PLACEMENTS.includes(placementParam) ? placementParam : 'home';

    const sessionId = searchParams.get('sessionId') || '';
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const auth = await getAuthUser(request).catch(() => null);

    const rawLimit = parseInt(searchParams.get('limit') || '8', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 24) : 8;

    const cartParam = searchParams.get('cart');
    const cartProductIds = cartParam
      ? cartParam.split(',').filter((s) => s.length === 36).slice(0, 50)
      : [];

    // Bucket on the account where possible so a customer's variant does not
    // change when they switch device or clear cookies.
    const identity = auth?.userId ?? sessionId;
    const variant = assignRecommendationVariant(identity);

    let products = await getRecommendations({
      placement,
      userId: auth?.userId ?? null,
      sessionId,
      productId: searchParams.get('productId'),
      category: searchParams.get('category'),
      cartProductIds,
      // Only the cart's own cross-sell rail hides what is already in the cart.
      excludeCartItems: searchParams.get('excludeCart') === '1',
      limit,
    });

    // Control group: popularity only, no personalisation. This is what the
    // hybrid recommender has to beat for the experiment to mean anything.
    if (variant === 'popularity') {
      products = products
        .filter((p) => p.reason === 'popularity')
        .concat(products.filter((p) => p.reason !== 'popularity'))
        .slice(0, limit)
        .map((p) => ({ ...p, reason: 'popularity' as const }));
    }

    return NextResponse.json(
      { products, variant, placement },
      {
        headers: {
          // Personalised and experiment-bucketed, so it must never be cached
          // by a CDN and handed to a different visitor.
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('[Recommendations GET] Error:', err?.message);
    // A broken rail should degrade to nothing, not break the page.
    return NextResponse.json({ products: [], variant: null });
  }
}

// Personalised per visitor, so it can never be statically rendered.
export const dynamic = 'force-dynamic';
