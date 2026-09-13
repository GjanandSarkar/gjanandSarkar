import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use RDS first, fallback to Supabase
    try {
      if (isPgConfigured) {
        const result = await query(
          `SELECT id, store_name, slug, state, category, description, logo_url, banner_url, total_sales, created_at 
           FROM sellers 
           WHERE id = $1 AND status = 'active'`,
          [id]
        );
        if (result.rows.length > 0) {
          return NextResponse.json({ seller: result.rows[0] });
        }
      }
    } catch (dbErr) {
      console.warn('[Seller GET] RDS fallback error:', dbErr);
    }

    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('sellers')
      .select('id, store_name, slug, state, category, description, logo_url, banner_url, total_sales, created_at')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    return NextResponse.json({ seller: data });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const admin = getAdminSupabase();

    // Verify ownership
    if (!auth.isAdmin) {
      const { data: storeCheck } = await admin.from('sellers').select('user_id').eq('id', id).single();
      if (!storeCheck || storeCheck.user_id !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const allowedUpdates = ['store_name', 'description', 'logo_url', 'banner_url'];
    
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    // Fetch old data for audit
    const { data: oldData } = await admin.from('sellers').select('*').eq('id', id).single();

    const { data, error } = await admin
      .from('sellers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      adminId: auth.userId,
      action: 'seller.update' as any,
      resourceType: 'seller',
      resourceId: id,
      details: { old: oldData, new: data },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ seller: data });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
