import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';

function toDbCoupon(input: any) {
  const dbData: Record<string, any> = {};

  if (input.code !== undefined) {
    dbData.code = String(input.code).trim().toUpperCase();
  }
  if (input.type !== undefined) {
    dbData.type = input.type === 'percentage' ? 'percentage' : 'flat';
  } else if (input.discount_amount !== undefined || input.value !== undefined) {
    dbData.type = 'flat';
  }

  if (input.value !== undefined) {
    dbData.value = Number(input.value);
  } else if (input.discount_amount !== undefined) {
    dbData.value = Number(input.discount_amount);
  }

  if (input.min_order_value !== undefined) {
    dbData.min_order_value = Number(input.min_order_value);
  } else if (input.min_order_amount !== undefined) {
    dbData.min_order_value = Number(input.min_order_amount);
  }

  if (input.max_discount !== undefined) {
    dbData.max_discount = input.max_discount != null && input.max_discount !== '' ? Number(input.max_discount) : null;
  }

  if (input.max_uses !== undefined) {
    dbData.max_uses = input.max_uses != null && input.max_uses !== '' ? Number(input.max_uses) : null;
  } else if (input.max_usage !== undefined) {
    dbData.max_uses = input.max_usage != null && input.max_usage !== '' ? Number(input.max_usage) : null;
  }

  if (input.is_active !== undefined) {
    dbData.is_active = Boolean(input.is_active);
  }

  if (input.expiry_date !== undefined) {
    dbData.expiry_date = input.expiry_date ? new Date(input.expiry_date).toISOString() : null;
  } else if (input.valid_until !== undefined) {
    dbData.expiry_date = input.valid_until ? new Date(input.valid_until).toISOString() : null;
  }

  return dbData;
}

function toApiCoupon(c: any) {
  if (!c) return c;
  return {
    ...c,
    // Normalized aliases for frontend backward compatibility
    discount_amount: Number(c.value ?? 0),
    min_order_amount: Number(c.min_order_value ?? 0),
    valid_until: c.expiry_date || null,
    max_usage: c.max_uses ?? null,
    usage_count: c.used_count ?? 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const adminOnly = searchParams.get('admin') === 'true';

    // If requesting admin view, require admin role
    if (adminOnly) {
      if (!auth?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const admin = getAdminSupabase();
    let query = admin.from('coupons').select('*').order('created_at', { ascending: false });

    // For public offers page, only return active and non-expired coupons
    if (!adminOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .or(`expiry_date.is.null,expiry_date.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let coupons = (data || []).map(toApiCoupon);
    if (!adminOnly) {
      coupons = coupons.filter((c: any) => !c.max_uses || (c.used_count || 0) < c.max_uses);
    }

    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const admin = getAdminSupabase();

    const dbPayload = toDbCoupon(body);

    const { data, error } = await admin.from('coupons').insert(dbPayload).select().single();
    if (error) throw error;
    
    await writeAuditLog({
      adminId: auth.userId,
      action: 'coupon.create',
      resourceType: 'coupon',
      resourceId: data.id,
      details: data,
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ coupon: toApiCoupon(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const admin = getAdminSupabase();
    const dbPayload = toDbCoupon(updates);

    // Fetch old for audit
    const { data: oldData } = await admin.from('coupons').select('*').eq('id', id).single();

    const { data, error } = await admin.from('coupons').update(dbPayload).eq('id', id).select().single();
    if (error) throw error;
    
    await writeAuditLog({
      adminId: auth.userId,
      action: 'coupon.update' as any,
      resourceType: 'coupon',
      resourceId: id,
      details: { old: oldData, new: data },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ coupon: toApiCoupon(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const admin = getAdminSupabase();
    const { error } = await admin.from('coupons').delete().eq('id', id);
    if (error) throw error;

    await writeAuditLog({
      adminId: auth.userId,
      action: 'coupon.delete' as any,
      resourceType: 'coupon',
      resourceId: id,
      details: { id },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
