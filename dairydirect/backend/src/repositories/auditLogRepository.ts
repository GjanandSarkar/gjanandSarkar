import { query } from '../config/database';
import { AuditLog } from '../models/auditLog';

export const auditLogRepository = {
  async logAction(data: {
    adminId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldData?: any;
    newData?: any;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_logs (
          admin_id, action, entity_type, entity_id, old_data, new_data, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.adminId || null,
          data.action,
          data.entityType,
          data.entityId || null,
          data.oldData ? JSON.stringify(data.oldData) : null,
          data.newData ? JSON.stringify(data.newData) : null,
          data.ipAddress || null,
        ]
      );
    } catch (err) {
      console.error('[Audit Log Error]:', err);
    }
  },

  async findRecent(limit = 100): Promise<AuditLog[]> {
    const res = await query<AuditLog>(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  },
};
