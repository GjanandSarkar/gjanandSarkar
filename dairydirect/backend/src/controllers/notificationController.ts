import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const notificationController = {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const notifications = await notificationService.getNotifications(userId, req.user?.role || 'customer');
      sendSuccess(res, { notifications });
    } catch (error) {
      next(error);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId, all } = req.body;
      const userId = req.user?.userId;
      await notificationService.markRead(notificationId, userId, all);
      sendSuccess(res, { success: true });
    } catch (error) {
      next(error);
    }
  },
};
