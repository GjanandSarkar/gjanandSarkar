import 'server-only';
import { unstable_cache } from 'next/cache';

import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * Business settings that customer-facing copy depends on.
 *
 * The free-delivery threshold lives in `business_settings` and drives the
 * real delivery fee in src/lib/pricing.ts. The sitewide top banner, however,
 * had "Free Shipping on Orders Above ₹499" hardcoded, while the pricing
 * engine defaults to ₹299 — so the headline promise on every page of the
 * site disagreed with what the cart actually charged.
 *
 * Reading it from one place means the banner can no longer drift from the
 * engine.
 */
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 299;

async function fetchFreeDeliveryThreshold(): Promise<number> {
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('business_settings')
      .select('free_delivery_threshold')
      .limit(1)
      .maybeSingle();

    if (error || !data) return DEFAULT_FREE_DELIVERY_THRESHOLD;

    const parsed = Number(data.free_delivery_threshold);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_FREE_DELIVERY_THRESHOLD;
  } catch {
    // Banner copy must never take the page down.
    return DEFAULT_FREE_DELIVERY_THRESHOLD;
  }
}

/**
 * Cached for an hour: it renders in the layout on every page, and the value
 * changes about never.
 */
export const getFreeDeliveryThreshold = unstable_cache(
  fetchFreeDeliveryThreshold,
  ['business-settings:free-delivery-threshold'],
  { revalidate: 3600, tags: ['business-settings'] },
);
