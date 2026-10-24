/**
 * POST /api/events
 *
 * Records customer activity (product views, cart adds, purchases). This is the
 * feed that every recommendation strategy learns from, so it is written on
 * ordinary page views and must stay cheap and non-blocking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { captureEvent } from '@/lib/analytics/experiments';

const EventSchema = z.object({
  productId: z.string().uuid(),
  eventType: z.enum(['view', 'add_to_cart', 'purchase']),
  sessionId: z.string().min(8).max(64),
  source: z.string().max(64).optional(),
  variant: z.string().max(32).optional(),
  quantity: z.number().int().positive().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const evt = parsed.data;

    // The user id comes from the verified session, never from the body.
    // Trusting a client-supplied user id here would let anyone write browsing
    // history into someone else's profile and poison their recommendations.
    const auth = await getAuthUser(request).catch(() => null);

    const sb = getAdminSupabase();
    const { error } = await sb.from('product_events').insert({
      user_id: auth?.userId ?? null,
      session_id: evt.sessionId,
      product_id: evt.productId,
      event_type: evt.eventType,
      source: evt.source ?? null,
      variant: evt.variant ?? null,
      quantity: evt.quantity ?? 1,
    });

    if (error) {
      // Tracking failures must never surface to the customer or block a page,
      // so this is logged and swallowed rather than returned as an error.
      console.warn('[Events POST] insert failed:', error.message);
      return NextResponse.json({ ok: true });
    }

    // Mirror into the external analytics tool for experiment analysis.
    void captureEvent({
      event: `product_${evt.eventType}`,
      distinctId: auth?.userId ?? evt.sessionId,
      properties: {
        product_id: evt.productId,
        source: evt.source,
        variant: evt.variant,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
