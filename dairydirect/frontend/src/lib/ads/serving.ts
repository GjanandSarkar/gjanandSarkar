/**
 * House ad serving and measurement.
 *
 * Campaigns are run by the platform, not bought by sellers, so there is no
 * auction or bidding here. Slot allocation is decided by three things, in
 * order: whether the campaign is eligible at all, how relevant it is to what
 * the visitor is doing, and the campaign's objective.
 */

import { getAdminSupabase } from '@/lib/supabase/admin';

export type AdPlacement = 'home' | 'product' | 'category' | 'cart' | 'search';
export type AdObjective = 'awareness' | 'traffic' | 'conversions' | 'clearance';

export interface Campaign {
  id: string;
  name: string;
  objective: AdObjective;
  status: string;
  placements: string[];
  product_ids: string[];
  target_category: string | null;
  priority: number;
  spend_amount: number;
  daily_frequency_cap: number | null;
  starts_at: string | null;
  ends_at: string | null;
}

export interface ServedAd {
  campaignId: string;
  campaignName: string;
  objective: AdObjective;
  productIds: string[];
  placement: AdPlacement;
}

export interface AdRequest {
  placement: AdPlacement;
  sessionId: string;
  userId?: string | null;
  /** Category being browsed, used for relevance matching. */
  category?: string | null;
  /** How many campaigns may fill this slot. */
  limit?: number;
}

/**
 * Default ceiling on how often one visitor sees the same campaign in a day
 * when the campaign itself sets no cap.
 *
 * Unlimited repetition is the fastest way to make a promotion feel like spam
 * and train people to ignore the slot entirely, so there is always a cap.
 */
export const DEFAULT_DAILY_FREQUENCY_CAP = 5;

/**
 * How much a campaign's objective boosts it for a given placement.
 *
 * A conversion campaign belongs next to the cart where intent is highest; an
 * awareness campaign belongs on the homepage where reach is highest. Matching
 * objective to surface is the difference between a placement strategy and
 * scattering adverts everywhere.
 */
const OBJECTIVE_FIT: Record<AdObjective, Partial<Record<AdPlacement, number>>> = {
  awareness: { home: 1.0, category: 0.7, search: 0.4, product: 0.3, cart: 0.1 },
  traffic: { home: 0.7, category: 1.0, search: 0.9, product: 0.5, cart: 0.2 },
  conversions: { cart: 1.0, product: 0.9, search: 0.7, category: 0.5, home: 0.3 },
  clearance: { cart: 0.8, category: 0.9, home: 0.5, product: 0.7, search: 0.6 },
};

/**
 * Pick campaigns for a slot.
 *
 * Returns an empty array rather than filling the slot with something
 * irrelevant: a blank space is better than an advert that makes the site look
 * untargeted.
 */
export async function serveAds(req: AdRequest): Promise<ServedAd[]> {
  const sb = getAdminSupabase();
  const limit = req.limit ?? 1;
  const now = new Date().toISOString();

  const { data: campaigns, error } = await sb
    .from('ad_campaigns')
    .select('*')
    .eq('status', 'active')
    .contains('placements', [req.placement])
    .order('priority', { ascending: false })
    .limit(50);

  if (error || !campaigns?.length) return [];

  // ─── Eligibility ─────────────────────────────────────────────────────────
  const eligible = (campaigns as Campaign[]).filter((c) => {
    if (c.starts_at && c.starts_at > now) return false;
    if (c.ends_at && c.ends_at < now) return false;
    // A campaign with nothing to promote cannot be rendered.
    if (!c.product_ids?.length && !c.target_category) return false;
    return true;
  });

  if (!eligible.length) return [];

  // ─── Frequency capping ───────────────────────────────────────────────────
  const notFatigued = await filterByFrequency(sb, eligible, req.sessionId);
  if (!notFatigued.length) return [];

  // ─── Rank by relevance, objective fit and priority ───────────────────────
  const ranked = notFatigued
    .map((c) => ({ campaign: c, score: relevanceScore(c, req) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map(({ campaign }) => ({
    campaignId: campaign.id,
    campaignName: campaign.name,
    objective: campaign.objective,
    productIds: campaign.product_ids ?? [],
    placement: req.placement,
  }));
}

/**
 * Score how well a campaign fits this particular request.
 *
 * Relevance is weighted above the admin-set priority on purpose: priority
 * should break ties between comparable campaigns, not let an irrelevant one
 * outrank a matching one just because someone typed a big number.
 */
export function relevanceScore(campaign: Campaign, req: AdRequest): number {
  let score = OBJECTIVE_FIT[campaign.objective]?.[req.placement] ?? 0.2;

  // Strong boost when the campaign targets exactly the category being browsed.
  if (req.category && campaign.target_category === req.category) {
    score += 1.0;
  } else if (req.category && campaign.target_category && campaign.target_category !== req.category) {
    // Targeted at a different category than the one on screen: still allowed,
    // but it should lose to anything that actually matches.
    score *= 0.3;
  }

  // Priority nudges, it does not dominate.
  score += Math.max(-0.5, Math.min(0.5, campaign.priority / 200));

  return score;
}

/**
 * Drop campaigns this visitor has already seen too often today.
 *
 * One grouped query for all candidate campaigns rather than one per campaign,
 * because this runs on every ad request.
 */
async function filterByFrequency(
  sb: any,
  campaigns: Campaign[],
  sessionId: string
): Promise<Campaign[]> {
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const { data, error } = await sb
    .from('ad_events')
    .select('campaign_id')
    .eq('session_id', sessionId)
    .eq('event_type', 'impression')
    .gte('created_at', since)
    .in(
      'campaign_id',
      campaigns.map((c) => c.id)
    );

  // If the frequency lookup fails, serve the ads rather than blanking every
  // slot on the site. Over-serving once is less harmful than a sitewide
  // outage of promotional content.
  if (error || !data) return campaigns;

  const seen = new Map<string, number>();
  for (const row of data) {
    seen.set(row.campaign_id, (seen.get(row.campaign_id) ?? 0) + 1);
  }

  return campaigns.filter((c) => {
    const cap = c.daily_frequency_cap ?? DEFAULT_DAILY_FREQUENCY_CAP;
    return (seen.get(c.id) ?? 0) < cap;
  });
}

// ─── Reporting ──────────────────────────────────────────────────────────────

export interface CampaignMetrics {
  campaignId: string;
  name: string;
  objective: AdObjective;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  /** Clicks per impression. Null when nothing has been shown yet. */
  ctr: number | null;
  /** Conversions per click. Null when nothing has been clicked yet. */
  conversionRate: number | null;
  /** Revenue per unit of spend. Null when nothing has been spent. */
  roas: number | null;
}

/**
 * Roll up delivery events into campaign performance.
 *
 * Every derived rate is null rather than zero when its denominator is zero.
 * A campaign that has never been shown has an *unknown* click-through rate,
 * not a 0% one, and reporting it as 0% would make a brand new campaign look
 * like a failing one.
 */
export async function getCampaignMetrics(): Promise<CampaignMetrics[]> {
  const sb = getAdminSupabase();

  const [{ data: campaigns }, { data: events }] = await Promise.all([
    sb.from('ad_campaigns').select('id, name, objective, status, spend_amount'),
    sb.from('ad_events').select('campaign_id, event_type, revenue'),
  ]);

  if (!campaigns) return [];

  const tally = new Map<
    string,
    { impressions: number; clicks: number; conversions: number; revenue: number }
  >();

  for (const ev of events ?? []) {
    let t = tally.get(ev.campaign_id);
    if (!t) {
      t = { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      tally.set(ev.campaign_id, t);
    }
    if (ev.event_type === 'impression') t.impressions++;
    else if (ev.event_type === 'click') t.clicks++;
    else if (ev.event_type === 'conversion') {
      t.conversions++;
      t.revenue += Number(ev.revenue) || 0;
    }
  }

  return campaigns.map((c: any) => {
    const t = tally.get(c.id) ?? {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
    };
    const spend = Number(c.spend_amount) || 0;

    return {
      campaignId: c.id,
      name: c.name,
      objective: c.objective,
      status: c.status,
      spend,
      impressions: t.impressions,
      clicks: t.clicks,
      conversions: t.conversions,
      revenue: t.revenue,
      ctr: t.impressions > 0 ? t.clicks / t.impressions : null,
      conversionRate: t.clicks > 0 ? t.conversions / t.clicks : null,
      roas: spend > 0 ? t.revenue / spend : null,
    };
  });
}
