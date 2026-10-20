import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer, getSellerForUser } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCustomer(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data: request, error } = await supabaseAdmin
    .from('return_requests')
    .select(`
      *,
      order_items (
        id, product_name, variant_weight, quantity, price, status, delivered_at,
        products (id, name, image_url)
      ),
      orders (
        id, order_number, created_at, payment_method, status, total_amount, payment_status
      ),
      user_addresses (*)
    `)
    .eq('id', id)
    .single();

  if (error || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Ownership verification: Customer, assigned Seller, or Admin
  let isAuthorized = auth.user.role === 'admin' || request.user_id === auth.user.id;
  if (!isAuthorized) {
    const seller = await getSellerForUser(auth.user.id);
    if (seller && seller.sellerId === request.seller_id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized to view this return request' }, { status: 403 });
  }

  // Fetch status events timeline and linked refund
  const [events, refunds] = await Promise.all([
    supabaseAdmin
      .from('status_events')
      .select('*')
      .eq('entity_type', request.request_type)
      .eq('entity_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('return_request_id', id)
      .maybeSingle(),
  ]);

  const times: Record<string, string> = {};
  for (const ev of events.data ?? []) {
    times[ev.to_status] = ev.created_at;
  }

  return NextResponse.json({
    ok: true,
    request,
    events: events.data ?? [],
    times,
    refund: refunds.data ?? null,
  });
}
