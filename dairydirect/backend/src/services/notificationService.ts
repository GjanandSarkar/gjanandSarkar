import { notificationRepository } from '../repositories/notificationRepository';
import { Notification } from '../models/notification';

export const notificationService = {
  async getNotifications(userId: string, role = 'customer'): Promise<Notification[]> {
    return notificationRepository.findByUserId(userId, role);
  },

  async markRead(notificationId?: string, userId?: string, all = false): Promise<void> {
    await notificationRepository.markAsRead(notificationId, userId, all);
  },

  async createNotification(data: Parameters<typeof notificationRepository.create>[0]): Promise<Notification> {
    return notificationRepository.create(data);
  },
};
