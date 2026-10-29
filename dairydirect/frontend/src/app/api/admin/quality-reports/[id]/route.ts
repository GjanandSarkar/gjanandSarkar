import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be approved or rejected.' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    const { data: updated, error } = await admin
      .from('quality_reports')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        product:products(id, name, image_url, category)
      `)
      .single();

    if (error) {
      console.error('Error updating quality report:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: 'quality_report.update_status' as any,
      resourceType: 'quality_report',
      resourceId: id,
      details: { status, adminNotes },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    });

    return NextResponse.json({
      report: updated,
      message: `Quality report marked as ${status}.`,
    });
  } catch (err: any) {
    console.error('Quality report PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const admin = getAdminSupabase();

    const { error } = await admin.from('quality_reports').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      adminId: auth.userId,
      action: 'quality_report.delete' as any,
      resourceType: 'quality_report',
      resourceId: id,
      details: { id },
      ipAddress: request.headers.get('x-forwarded-for') || '',
    });

    return NextResponse.json({ success: true, message: 'Quality report deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
