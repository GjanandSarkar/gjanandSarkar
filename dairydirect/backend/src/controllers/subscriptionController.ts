import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { sendCreated, sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const subscriptionController = {
  async getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || req.user?.userId;
      if (!userId && req.user?.role !== 'admin') {
        throw new UnauthorizedError('User ID required');
      }

      if (req.user?.role === 'admin' && !userId) {
        const result = await subscriptionService.listAllSubscriptions({});
        sendSuccess(res, { subscriptions: result.subscriptions, total: result.total });
        return;
      }

      const subscriptions = await subscriptionService.getUserSubscriptions(userId!);
      sendSuccess(res, { subscriptions });
    } catch (error) {
      next(error);
    }
  },

  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const subscription = await subscriptionService.createSubscription({
        ...req.body,
        userId,
      });

      sendCreated(res, { id: subscription.id, subscription });
    } catch (error) {
      next(error);
    }
  },

  async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.body.userId as string) || req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const { subId, action, newVolume, newPlan, pauseUntil } = req.body;
      const subscription = await subscriptionService.updateSubscriptionAction(subId, userId, action, {
        newVolume,
        newPlan,
        pauseUntil,
      });

      sendSuccess(res, { subscription });
    } catch (error) {
      next(error);
    }
  },
};
