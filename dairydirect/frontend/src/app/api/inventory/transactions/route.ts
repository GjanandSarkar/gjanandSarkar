/**
 * GET /api/inventory/transactions
 * Audit ledger history of inventory transactions.
 * Accessible to admins, and sellers for their own products.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));

    const sb = getAdminSupabase();

    // Verify seller permission if not admin
    if (!auth.isAdmin) {
      if (productId) {
        const { data: prod } = await sb.from('products').select('seller_id, created_by').eq('id', productId).maybeSingle();
        const { data: seller } = await sb.from('sellers').select('id').eq('user_id', auth.userId).maybeSingle();
        const isOwner = prod && (prod.seller_id === seller?.id || prod.created_by === auth.userId);
        if (!isOwner) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        // Seller can only view transactions where they are the actor or own the product
        const { data: seller } = await sb.from('sellers').select('id').eq('user_id', auth.userId).maybeSingle();
        if (!seller) {
          return NextResponse.json({ transactions: [] });
        }
      }
    }

    let query = sb
      .from('inventory_transactions')
      .select('*, product_variants(weight, price), products(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
