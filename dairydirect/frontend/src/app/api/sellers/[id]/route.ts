import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';
import { invalidateSellerProfileCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Seller identifier is required' }, { status: 400 });
    }

    const auth = await getAuthUser(request);
    const admin = getAdminSupabase();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = admin
      .from('sellers')
      .select('*, profiles:user_id(name, email, phone, avatar_url)');

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: seller, error } = await query.maybeSingle();

    if (error || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Access control:
    // If seller is active, anyone can view it.
    // If seller is NOT active (e.g. pending, under_review, deactivated, rejected),
    // allow access only if caller is the store owner or an admin.
    const isOwner = auth?.userId && seller.user_id === auth.userId;
    const isAdmin = !!auth?.isAdmin;

    if (seller.status !== 'active' && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'This seller store is not currently active', status: seller.status },
        { status: 404 }
      );
    }

    // Fetch live product count from seller_product & products
    const { count: prodCount } = await admin
      .from('seller_product')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', seller.id);

    return NextResponse.json({
      seller: {
        ...seller,
        products_count: prodCount || 0,
      },
    });
  } catch (err: any) {
    console.error('[Seller GET id] Exception:', err.message);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const admin = getAdminSupabase();

    // Verify ownership and check seller status
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let checkQuery = admin.from('sellers').select('*');
    if (isUuid) {
      checkQuery = checkQuery.eq('id', id);
    } else {
      checkQuery = checkQuery.eq('slug', id);
    }

    const { data: existingStore, error: checkErr } = await checkQuery.maybeSingle();
    if (checkErr || !existingStore) {
      return NextResponse.json({ error: 'Seller store not found' }, { status: 404 });
    }

    const storeId = existingStore.id;

    if (!auth.isAdmin) {
      if (existingStore.user_id !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (['permanently_deactivated'].includes(existingStore.status)) {
        return NextResponse.json(
          { error: `Your seller account is ${existingStore.status}. You cannot modify store settings.` },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Expanded allowed fields for live seller profile updates
    const allowedSellerUpdates = [
      'store_name',
      'slug',
      'description',
      'logo_url',
      'banner_url',
      'state',
      'category',
      'gstin',
      'pan',
      'bank_account',
      'ifsc_code',
      'fssai_number',
    ];

    // Admin can also update plan, commission_rate, and status
    const allowedAdminUpdates = ['plan', 'commission_rate', 'status'];

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowedSellerUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (auth.isAdmin) {
      for (const key of allowedAdminUpdates) {
        if (body[key] !== undefined) {
          updates[key] = body[key];
        }
      }
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    // Execute update
    const { data: updatedSeller, error: updateErr } = await admin
      .from('sellers')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (updateErr) {
      console.error('[Seller PATCH] Update error:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If status was changed, log live transition to seller_status_history
    if (updates.status && updates.status !== existingStore.status) {
      try {
        await admin.from('seller_status_history').insert({
          seller_id: storeId,
          previous_status: existingStore.status,
          new_status: updates.status,
          action: `status_changed_to_${updates.status}`,
          reason: body.reason || 'Store status updated via API',
          notes: body.notes || `Status transitioned from ${existingStore.status} to ${updates.status}`,
          changed_by: auth.userId,
        });
      } catch (historyErr) {
        console.warn('[Seller PATCH] Status history audit warning:', historyErr);
      }
    }

    // Audit log
    await writeAuditLog({
      adminId: auth.userId,
      action: 'seller.update' as any,
      resourceType: 'seller',
      resourceId: storeId,
      details: { old: existingStore, new: updatedSeller },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    });

    // Invalidate caches
    if (existingStore.user_id) {
      await invalidateSellerProfileCache(existingStore.user_id);
    }

    return NextResponse.json({ success: true, seller: updatedSeller });
  } catch (err: any) {
    console.error('[Seller PATCH] Exception:', err.message);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
