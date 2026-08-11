import { query } from '../config/database';
import { Notification, NotificationType, RoleTarget } from '../models/notification';

export const notificationRepository = {
  async findByUserId(userId: string, role: string = 'customer'): Promise<Notification[]> {
    const res = await query<Notification>(
      `SELECT * FROM notifications
       WHERE (user_id = $1 OR role_target = 'all' OR role_target = $2)
       ORDER BY created_at DESC LIMIT 50`,
      [userId, role]
    );
    return res.rows;
  },

  async create(data: {
    userId?: string | null;
    roleTarget?: RoleTarget;
    title: string;
    message: string;
    type?: NotificationType;
    relatedId?: string | null;
  }): Promise<Notification> {
    const res = await query<Notification>(
      `INSERT INTO notifications (
        user_id, role_target, title, message, type, related_id
      ) VALUES ($1, COALESCE($2, 'customer'), $3, $4, COALESCE($5, 'info'), $6)
      RETURNING *`,
      [
        data.userId || null,
        data.roleTarget || 'customer',
        data.title,
        data.message,
        data.type || 'info',
        data.relatedId || null,
      ]
    );
    return res.rows[0];
  },

  async markAsRead(notificationId?: string, userId?: string, all = false): Promise<void> {
    if (all && userId) {
      await query('UPDATE notifications SET is_read = true WHERE user_id = $1 OR role_target = \'all\'', [userId]);
    } else if (notificationId) {
      await query('UPDATE notifications SET is_read = true WHERE id = $1', [notificationId]);
    }
  },
};
