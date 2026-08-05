/**
 * Admin Action Audit Log
 * Records all admin actions to the audit_logs table in PostgreSQL.
 * Critical for compliance and security investigations.
 */

import { query } from '@/lib/aws/rds';

export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.activate'
  | 'product.deactivate'
  | 'order.status_update'
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
  action: AuditAction;
  resourceType: string;    // e.g. 'product', 'order'
  resourceId: string;      // ID of affected resource
  details?: object;        // Before/after values
  ipAddress?: string;
}

/**
 * Write an audit log entry.
 * Non-blocking: failures are logged but don't break the main operation.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.adminId,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress || null,
      ]
    );
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
  const conditions: string[] = ['1=1'];
  const values: any[] = [];
  let paramIdx = 1;

  if (params.adminId) {
    conditions.push(`al.admin_id = $${paramIdx++}`);
    values.push(params.adminId);
  }

  if (params.resourceType) {
    conditions.push(`al.resource_type = $${paramIdx++}`);
    values.push(params.resourceType);
  }

  values.push(params.limit ?? 50);
  values.push(params.offset ?? 0);

  const result = await query(
    `SELECT 
       al.*,
       p.name as admin_name,
       p.email as admin_email
     FROM audit_logs al
     LEFT JOIN profiles p ON p.id = al.admin_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY al.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    values
  );

  return result.rows;
}
