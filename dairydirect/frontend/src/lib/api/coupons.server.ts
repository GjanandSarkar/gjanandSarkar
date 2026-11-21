/**
 * Server-side coupon reads.
 *
 * `/offers` used to `fetch()` its own `/api/coupons` route over HTTP. That is a
 * self-referential round trip: the render waited on a second Node request,
 * which itself waited on an unbounded Supabase call. With the database
 * unreachable locally the page took ~7.1 s to render an empty state.
 *
 * Reading the table directly removes the extra hop, and `withTimeout` bounds
 * the only remaining network call.
 */

import { getAdminSupabase } from '@/lib/supabase/admin';
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout';

export interface PublicCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  discount_amount: number;
  min_order_amount: number;
  valid_until: string | null;
  max_usage: number | null;
  usage_count: number;
}

type Row = Record<string, unknown>;

function toPublicCoupon(row: Row): PublicCoupon {
  return {
    id: String(row.id),
    code: String(row.code ?? ''),
    type: row.type === 'percentage' ? 'percentage' : 'flat',
    value: Number(row.value ?? 0),
    discount_amount: Number(row.value ?? 0),
    min_order_amount: Number(row.min_order_value ?? 0),
    valid_until: (row.expiry_date as string | null) ?? null,
    max_usage: (row.max_uses as number | null) ?? null,
    usage_count: Number(row.used_count ?? 0),
  };
}

export async function getActiveCouponsServer(): Promise<PublicCoupon[]> {
  try {
    const admin = getAdminSupabase();
    const now = new Date().toISOString();

    const { data, error } = await withTimeout(
      async () =>
        admin
          .from('coupons')
          .select('id, code, type, value, min_order_value, expiry_date, max_uses, used_count, is_active')
          .eq('is_active', true)
          .or(`expiry_date.is.null,expiry_date.gt.${now}`)
          .order('created_at', { ascending: false })
          .limit(24),
      TIMEOUTS.settings,
      'active-coupons'
    );

    if (error) throw error;
    return ((data ?? []) as Row[]).map(toPublicCoupon);
  } catch (error) {
    console.error('[coupons] getActiveCouponsServer failed:', error);
    return [];
  }
}
