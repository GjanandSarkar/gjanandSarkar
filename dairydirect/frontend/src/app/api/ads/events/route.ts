/**
 * POST /api/ads/events
 *
 * Records impressions, clicks and conversions against a campaign. These rows
 * are the basis of CTR, conversion rate and ROAS, so they are written only by
 * the server (the table has no client-facing insert policy) and conversions
 * are revalued server-side rather than trusting the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { captureEvent } from '@/lib/analytics/experiments';

const AdEventSchema = z.object({
  campaignId: z.string().uuid(),
  eventType: z.enum(['impression', 'click', 'conversion']),
  sessionId: z.string().min(8).max(64),
  productId: z.string().uuid().optional(),
  placement: z.string().max(32).optional(),
  variant: z.string().max(32).optional(),
  /** Only meaningful on conversions; ignored otherwise. */
  orderId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = AdEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ad event' }, { status: 400 });
    }

    const evt = parsed.data;
    const auth = await getAuthUser(request).catch(() => null);
    const sb = getAdminSupabase();

    // Revenue is read from the order row, never accepted from the client.
    // Attributed revenue divided by spend is ROAS, which is a number the
    // business will make decisions on; a browser must not be able to set it.
    let revenue = 0;
    if (evt.eventType === 'conversion' && evt.orderId) {
      const { data: order } = await sb
        .from('orders')
        .select('total_amount, user_id')
        .eq('id', evt.orderId)
        .maybeSingle();

      // Only credit an order that genuinely belongs to the caller.
      if (order && auth?.userId && order.user_id === auth.userId) {
        revenue = Number(order.total_amount) || 0;
      }
    }

    const { error } = await sb.from('ad_events').insert({
      campaign_id: evt.campaignId,
      product_id: evt.productId ?? null,
      user_id: auth?.userId ?? null,
      session_id: evt.sessionId,
      event_type: evt.eventType,
      placement: evt.placement ?? null,
      variant: evt.variant ?? null,
      revenue,
    });

    if (error) {
      console.warn('[AdEvents POST] insert failed:', error.message);
      return NextResponse.json({ ok: true });
    }

    void captureEvent({
      event: `ad_${evt.eventType}`,
      distinctId: auth?.userId ?? evt.sessionId,
      properties: {
        campaign_id: evt.campaignId,
        placement: evt.placement,
        variant: evt.variant,
        revenue,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
