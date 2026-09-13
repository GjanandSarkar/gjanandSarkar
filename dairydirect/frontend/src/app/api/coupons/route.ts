import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { writeAuditLog } from '@/lib/security/audit';

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

    // For public offers page, only return active and valid coupons
    if (!adminOnly) {
      query = query
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());
      // Actually we also need to check usage_count < max_usage, but that might require an RPC or we filter post-fetch
    }

    const { data, error } = await query;

    if (error) throw error;

    let coupons = data;
    if (!adminOnly) {
      coupons = coupons.filter((c: any) => !c.max_usage || c.usage_count < c.max_usage);
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

    const { data, error } = await admin.from('coupons').insert(body).select().single();
    if (error) throw error;
    
    await writeAuditLog({
      adminId: auth.userId,
      action: 'coupon.create',
      resourceType: 'coupon',
      resourceId: data.id,
      details: data,
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ coupon: data });
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

    // Fetch old for audit
    const { data: oldData } = await admin.from('coupons').select('*').eq('id', id).single();

    const { data, error } = await admin.from('coupons').update(updates).eq('id', id).select().single();
    if (error) throw error;
    
    await writeAuditLog({
      adminId: auth.userId,
      action: 'coupon.update' as any,
      resourceType: 'coupon',
      resourceId: id,
      details: { old: oldData, new: data },
      ipAddress: request.headers.get('x-forwarded-for') || ''
    });

    return NextResponse.json({ coupon: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
