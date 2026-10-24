import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function writeAudit(
  adminId: string,
  action: string,
  entity: string,
  entityId: string,
  oldData: unknown,
  newData: unknown,
  req: NextRequest | Request
) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? null;

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entity,
      entity_id: String(entityId),
      old_data: oldData ?? null,
      new_data: newData ?? null,
      ip_address: ip,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
