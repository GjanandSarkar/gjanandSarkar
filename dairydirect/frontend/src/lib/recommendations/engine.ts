/**
 * Recommendation engine: fetches the signals, runs the strategies in
 * `scoring.ts`, and returns ranked products.
 *
 * Computation is live per request (no precomputed table), so every query here
 * is bounded: a capped event window, a capped candidate catalogue, and a
 * single round trip per signal. Nothing fans out per product.
 */

import { getAdminSupabase } from '@/lib/supabase/admin';
import {
  scoreByPopularity,
  scoreByContent,
  scoreByCollaborative,
  hybridScore,
  diversify,
  excludeIds,
  POPULARITY_WINDOW_DAYS,
  type ActivityEvent,
  type ProductFeatures,
  type ScoredProduct,
} from './scoring';

/** Where a rail is being rendered. Drives which strategies make sense. */
export type Placement = 'home' | 'product' | 'category' | 'cart';

export interface RecommendationRequest {
  placement: Placement;
  userId?: string | null;
  sessionId: string;
  /** Product being viewed, on a product page. */
  productId?: string | null;
  /** Category being browsed, on a category page. */
  category?: string | null;
  /** Product ids currently in the cart. */
  cartProductIds?: string[];
  /** Hide cart items from the results. Defaults to false; the cart
   *  cross-sell rail opts in. */
  excludeCartItems?: boolean;
  limit?: number;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  brand: string | null;
  rating: number | null;
  reviews_count: number | null;
  product_variants: {
    id: string;
    weight: string;
    price: number;
    original_price: number | null;
    stock: number;
  }[];
  /** Why this was recommended — surfaced in the UI and used in A/B analysis. */
  reason: ScoredProduct['reason'];
}

/**
 * How many events to pull into memory for one request.
 *
 * Live scoring means this runs on page loads, so it has to stay bounded. The
 * cap is generous enough to capture real co-occurrence patterns but small
 * enough that the scoring loop stays in the low milliseconds.
 */
const EVENT_FETCH_LIMIT = 5000;

/** Candidate catalogue ceiling for content-based similarity. */
const CATALOGUE_LIMIT = 500;

const DEFAULT_LIMIT = 8;

/**
 * Main entry point. Always returns something: if every personalised strategy
 * comes back empty (a brand new visitor on a brand new catalogue), it degrades
 * to popularity and finally to the plain catalogue, because an empty rail is a
 * worse answer than an unpersonalised one.
 */
export async function getRecommendations(
  req: RecommendationRequest
): Promise<RecommendedProduct[]> {
  const limit = req.limit ?? DEFAULT_LIMIT;
  const sb = getAdminSupabase();

  const [events, catalogue, userHistory] = await Promise.all([
    fetchRecentEvents(sb),
    fetchCatalogue(sb, req.category),
    fetchUserHistory(sb, req.userId, req.sessionId),
  ]);

  const featureMap = new Map<string, ProductFeatures & { raw: any }>();
  for (const p of catalogue) {
    featureMap.set(p.id, {
      id: p.id,
      category: p.category,
      brand: p.brand,
      tags: p.tags,
      price: lowestPrice(p),
      raw: p,
    });
  }

  // ─── Decide which strategies apply to this placement ─────────────────────
  const lists: ScoredProduct[][] = [];

  // Popularity always participates; it is the floor under every rail.
  lists.push(scoreByPopularity(events));

  // Content-based needs seeds: the product being viewed, the cart, or the
  // visitor's recent history.
  const seedIds = resolveSeeds(req, userHistory);
  const seeds = seedIds
    .map((id) => featureMap.get(id))
    .filter((f): f is ProductFeatures & { raw: any } => Boolean(f));

  if (seeds.length > 0) {
    lists.push(scoreByContent(seeds, Array.from(featureMap.values())));
  }

  // Collaborative needs the visitor to have done something, and enough other
  // people to have done something overlapping. It self-censors below the
  // co-occurrence threshold, so a weak signal returns nothing rather than
  // noise.
  if (seedIds.length > 0) {
    lists.push(scoreByCollaborative(seedIds, events));
  }

  // ─── Blend, then apply safeguards ────────────────────────────────────────
  let ranked = hybridScore(lists);

  /* Exclude what they already own or are currently looking at.

     Cart items are excluded only where that actually helps -- a cross-sell
     rail beside the cart. On a popularity rail ("What other shoppers are
     buying") excluding them was wrong: with a small catalogue, adding one
     product emptied the rail and the entire section vanished mid-browse.
     Cart items still SEED the recommendations either way; this only
     controls whether they can also be shown. */
  const exclude = new Set<string>([
    ...(req.excludeCartItems ? (req.cartProductIds ?? []) : []),
    ...userHistory.purchasedProductIds,
  ]);
  if (req.productId) exclude.add(req.productId);
  ranked = excludeIds(ranked, exclude);

  // Only recommend things a customer can actually buy. A rail of out-of-stock
  // products is an advert for the competition.
  ranked = ranked.filter((r) => {
    const f = featureMap.get(r.productId);
    return f ? hasStock(f.raw) : false;
  });

  // Stop the rail collapsing into one category.
  ranked = diversify(ranked, (id) => featureMap.get(id)?.category ?? null, limit);

  let result = ranked
    .map((r) => {
      const f = featureMap.get(r.productId);
      return f ? toRecommended(f.raw, r.reason) : null;
    })
    .filter((p): p is RecommendedProduct => p !== null);

  // Final fallback: a cold catalogue with no events at all.
  if (result.length < Math.min(4, limit)) {
    const seen = new Set(result.map((p) => p.id));
    for (const p of catalogue) {
      if (result.length >= limit) break;
      if (seen.has(p.id) || exclude.has(p.id) || !hasStock(p)) continue;
      result.push(toRecommended(p, 'popularity'));
      seen.add(p.id);
    }
  }

  return result.slice(0, limit);
}

/**
 * Which products should drive similarity for this request.
 *
 * Ordered by how clearly each signals present intent: the product on screen
 * right now beats the cart, which beats last week's browsing.
 */
function resolveSeeds(
  req: RecommendationRequest,
  history: UserHistory
): string[] {
  const seeds: string[] = [];

  if (req.productId) seeds.push(req.productId);
  if (req.cartProductIds?.length) seeds.push(...req.cartProductIds);

  // Recent views fill the gap on the homepage, where there is no on-page
  // context at all.
  for (const id of history.recentProductIds) {
    if (seeds.length >= 10) break;
    if (!seeds.includes(id)) seeds.push(id);
  }

  return seeds;
}

interface UserHistory {
  recentProductIds: string[];
  purchasedProductIds: string[];
}

async function fetchUserHistory(
  sb: any,
  userId: string | null | undefined,
  sessionId: string
): Promise<UserHistory> {
  // Match on the account when signed in, otherwise on the browser session, so
  // recommendations work before login.
  const query = sb
    .from('product_events')
    .select('product_id, event_type')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = userId
    ? await query.eq('user_id', userId)
    : await query.eq('session_id', sessionId);

  if (error || !data) return { recentProductIds: [], purchasedProductIds: [] };

  const recent: string[] = [];
  const purchased: string[] = [];
  for (const row of data) {
    if (!recent.includes(row.product_id)) recent.push(row.product_id);
    if (row.event_type === 'purchase') purchased.push(row.product_id);
  }

  return { recentProductIds: recent, purchasedProductIds: purchased };
}

async function fetchRecentEvents(sb: any): Promise<ActivityEvent[]> {
  const since = new Date(
    Date.now() - POPULARITY_WINDOW_DAYS * 86_400_000
  ).toISOString();

  const { data, error } = await sb
    .from('product_events')
    .select('user_id, session_id, product_id, event_type, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(EVENT_FETCH_LIMIT);

  if (error || !data) return [];
  return data as ActivityEvent[];
}

async function fetchCatalogue(sb: any, category?: string | null) {
  let query = sb
    .from('products')
    .select(
      'id, name, category, image_url, brand, tags, rating, reviews_count, product_variants(id, weight, price, original_price, stock)'
    )
    .eq('is_active', true)
    .limit(CATALOGUE_LIMIT);

  // On a category page the whole rail should stay inside that category;
  // suggesting unrelated departments there is noise, not discovery.
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

function lowestPrice(product: any): number | null {
  const prices = (product.product_variants ?? [])
    .map((v: any) => Number(v.price))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

function hasStock(product: any): boolean {
  return (product.product_variants ?? []).some((v: any) => Number(v.stock) > 0);
}

function toRecommended(raw: any, reason: ScoredProduct['reason']): RecommendedProduct {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category ?? null,
    image_url: raw.image_url ?? null,
    brand: raw.brand ?? null,
    rating: raw.rating ?? null,
    reviews_count: raw.reviews_count ?? null,
    product_variants: raw.product_variants ?? [],
    reason,
  };
}

/** Human-readable label for why something was recommended. */
export const REASON_LABELS: Record<ScoredProduct['reason'], string> = {
  popularity: 'Popular right now',
  content: 'Similar to what you viewed',
  collaborative: 'Customers also bought',
};
