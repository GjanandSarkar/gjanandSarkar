import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending'; // 'pending' | 'approved' | 'rejected' | 'all'
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const sb = getAdminSupabase();

    // Query seller_product_approval staging table
    let query = sb
      .from('seller_product_approval')
      .select(`
        *,
        sellers:seller_id(id, store_name, status, category, user_id, gstin, pan)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,id.ilike.%${search}%,brand.ilike.%${search}%`
      );
    }

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('[AdminProductApprovals GET] Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Status counts
    const { count: pendingCount } = await sb
      .from('seller_product_approval')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedCount } = await sb
      .from('seller_product_approval')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedCount } = await sb
      .from('seller_product_approval')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // Format products for frontend consumption
    const formatted = (requests || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      subcategory: r.subcategory,
      brand: r.brand,
      sku: r.sku,
      image_url: r.image_url,
      gallery_images: r.gallery_images || [],
      approval_status: r.status,
      is_approved: Boolean(r.is_approved),
      is_rejected: Boolean(r.is_rejected),
      rejection_reason: r.rejection_reason || r.admin_notes || null,
      is_active: r.status === 'approved',
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      tax_rate: r.tax_rate,
      shipping_details: r.shipping_details,
      return_policy: r.return_policy,
      attributes: r.attributes,
      compliance_documents: r.compliance_documents,
      product_variants: [
        {
          id: 'v-' + r.id,
          weight: r.weight || 'Standard',
          price: r.price,
          compare_at_price: r.original_price,
          stock: r.stock,
        },
      ],
      sellers: r.sellers,
      product_id: r.product_id,
    }));

    return NextResponse.json({
      success: true,
      products: formatted,
      total: count || formatted.length,
      counts: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        suspended: 0,
        all: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
      },
    });
  } catch (err: any) {
    console.error('[AdminProductApprovals GET] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, rejectionReason, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and new status are required' }, { status: 400 });
    }

    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json({ error: 'Please enter a rejection reason for the seller.' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // 1. Fetch current approval request
    const { data: approvalReq, error: fetchErr } = await sb
      .from('seller_product_approval')
      .select('*, sellers:seller_id(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !approvalReq) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    if (approvalReq.status !== 'pending') {
      return NextResponse.json(
        { error: `This product request has already been ${approvalReq.status}.` },
        { status: 400 }
      );
    }

    let resultingProductId: string | null = null;

    if (status === 'approved') {
      // 2a. Atomically approve using database function
      const { data: approvedProdId, error: rpcErr } = await sb.rpc('approve_seller_product', {
        p_approval_id: id,
        p_admin_id: auth.userId,
        p_notes: notes || 'Approved by admin',
      });

      if (rpcErr) {
        console.error('[AdminProductApprovals PATCH] approve_seller_product RPC error:', rpcErr.message);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      resultingProductId = approvedProdId;

      // Invalidate inventory cache
      if (resultingProductId) {
        await revalidateInventory({ productId: resultingProductId });
      }

      // Notify seller
      const sellerUserId = (approvalReq.sellers as any)?.user_id || approvalReq.seller_user_id;
      if (sellerUserId) {
        try {
          await sb.from('notifications').insert({
            user_id: sellerUserId,
            role_target: 'seller',
            title: 'Product Approved!',
            message: `Your product "${approvalReq.name}" has been approved by admin and is now live on the marketplace!`,
            type: 'system',
            related_id: resultingProductId,
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Product successfully approved and published to marketplace.',
        productId: resultingProductId,
      });
    } else if (status === 'rejected') {
      // 2b. Atomically reject using database function
      const { data: rejectedId, error: rpcErr } = await sb.rpc('reject_seller_product', {
        p_approval_id: id,
        p_admin_id: auth.userId,
        p_rejection_reason: rejectionReason.trim(),
      });

      if (rpcErr) {
        console.error('[AdminProductApprovals PATCH] reject_seller_product RPC error:', rpcErr.message);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      // Notify seller
      const sellerUserId = (approvalReq.sellers as any)?.user_id || approvalReq.seller_user_id;
      if (sellerUserId) {
        try {
          await sb.from('notifications').insert({
            user_id: sellerUserId,
            role_target: 'seller',
            title: 'Product Submission Rejected',
            message: `Your product "${approvalReq.name}" was not approved. Reason: ${rejectionReason.trim()}. You may review the feedback and resubmit it from your seller dashboard.`,
            type: 'alert',
            related_id: id,
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Product submission rejected and feedback recorded.',
        rejectedId,
      });
    } else {
      return NextResponse.json({ error: `Unsupported status action: ${status}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[AdminProductApprovals PATCH] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
