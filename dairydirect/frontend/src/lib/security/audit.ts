/**
 * Admin Action Audit Log
 * Records all admin actions to the audit_logs table via Supabase.
 * Critical for compliance and security investigations.
 */

import { getAdminSupabase } from '@/lib/supabase/admin';

export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.activate'
  | 'product.deactivate'
  | 'order.status_update'
  | 'order.update'
  | 'order.cancel'
  | 'coupon.create'
  | 'coupon.delete'
  | 'return.approve'
  | 'return.reject'
  | 'stock.update'
  | 'user.role_change'
  | 'settings.update'
  | 'delivery_slot.update';

export interface AuditLogEntry {
  adminId: string;
  action: AuditAction | string;
  resourceType: string;    // e.g. 'product', 'order'
  resourceId: string;      // ID of affected resource
  details?: object;        // Before/after values
  ipAddress?: string;
}

/**
 * Write an audit log entry via Supabase.
 * Non-blocking: failures are logged but don't break the main operation.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const sb = getAdminSupabase();
    const { error } = await sb.from('audit_logs').insert({
      admin_id: entry.adminId,
      action: entry.action,
      entity_type: entry.resourceType,
      entity_id: entry.resourceId,
      new_data: entry.details || null,
      ip_address: entry.ipAddress || null,
    });

    if (error) {
      console.error('[AuditLog] Supabase insert error:', error.message);
    }
  } catch (err) {
    // Audit log failure should never break the main operation
    console.error('[AuditLog] Failed to write audit entry:', err);
  }
}

/**
 * Get recent audit logs for admin (paginated)
 */
export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
  adminId?: string;
  resourceType?: string;
}): Promise<any[]> {
  try {
    const sb = getAdminSupabase();
    let query = sb
      .from('audit_logs')
      .select('*, profiles!audit_logs_admin_id_fkey(name, email)')
      .order('created_at', { ascending: false })
      .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

    if (params.adminId) {
      query = query.eq('admin_id', params.adminId);
    }

    if (params.resourceType) {
      query = query.eq('entity_type', params.resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuditLog] Failed to fetch audit logs:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row,
      // Map DB column names to the format callers expect
      resource_type: row.entity_type,
      resource_id: row.entity_id,
      details: row.new_data,
      admin_name: row.profiles?.name,
      admin_email: row.profiles?.email,
    }));
  } catch (err) {
    console.error('[AuditLog] Failed to fetch audit logs:', err);
    return [];
  }
}
