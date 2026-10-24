import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireSeller(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');

  let q = supabaseAdmin
    .from('return_requests')
    .select(`
      *,
      order_items (
        id, product_name, variant_name, quantity, unit_price, total_price, image_url
      ),
      orders (
        id, order_number, created_at, payment_method, status
      ),
      user_addresses (*)
    `)
    .order('created_at', { ascending: false });

  if (auth.user.role !== 'admin') {
    q = q.eq('seller_id', auth.seller.sellerId);
  }
  if (type) {
    q = q.eq('request_type', type);
  }
  if (status) {
    q = q.eq('status', status);
  }

  const { data: requests, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, requests: requests ?? [] });
}
