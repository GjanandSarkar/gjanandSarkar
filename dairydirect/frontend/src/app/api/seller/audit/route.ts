import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * Activity log for the signed-in seller.
 *
 * Scoping is the whole point of this endpoint. The seller id is taken from
 * the verified session and never from the query string or body, and the query
 * is filtered to that id, so one seller can never read another seller's
 * activity by changing a parameter. Admins are not special-cased here either;
 * they have /api/admin/audit for the full picture.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getAdminSupabase();

    // The caller must actually be a seller.
    const { data: seller } = await sb
      .from('sellers')
      .select('id, status')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (!seller && !auth.isAdmin) {
      return NextResponse.json({ error: 'Seller account required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

    const { data, error } = await sb
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, new_data, created_at')
      // Always the session's own user id. Never a client-supplied value.
      .eq('admin_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ logs: data ?? [] });
  } catch (err: any) {
    console.error('[SellerAudit GET] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}
