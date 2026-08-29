/**
 * GET /api/admin/analytics
 * Business Intelligence Analytics API using Admin Supabase (bypassing client RLS).
 * Admin access required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sb = getAdminSupabase();
    const [ordersRes, profilesRes, subsRes] = await Promise.all([
      sb
        .from('orders')
        .select('id, created_at, total_amount, status, user_id, order_items(product_id, quantity, price, products(name, category))')
        .order('created_at', { ascending: false }),
      sb
        .from('profiles')
        .select('id, created_at'),
      sb
        .from('subscriptions')
        .select('id, status, created_at, plan, product_id, products(name)')
    ]);

    if (ordersRes.error) console.error('[Analytics API] Orders error:', ordersRes.error.message);
    if (profilesRes.error) console.error('[Analytics API] Profiles error:', profilesRes.error.message);
    if (subsRes.error) console.error('[Analytics API] Subscriptions error:', subsRes.error.message);

    return NextResponse.json({
      orders: ordersRes.data || [],
      profiles: profilesRes.data || [],
      subscriptions: subsRes.data || [],
    });
  } catch (error: any) {
    console.error('[Analytics API] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
