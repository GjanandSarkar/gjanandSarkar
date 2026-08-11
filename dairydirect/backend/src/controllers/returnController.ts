import { Request, Response, NextFunction } from 'express';
import { returnService } from '../services/returnService';
import { sendCreated, sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../errors/AppError';

export const returnController = {
  async listReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'admin';
      const userId = isAdmin ? (req.query.userId as string) : req.user?.userId;
      const status = req.query.status as any;

      const returns = await returnService.listReturns({ userId, status });
      sendSuccess(res, { returns });
    } catch (error) {
      next(error);
    }
  },

  async submitReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || (req.body.userId as string);
      if (!userId) {
        throw new UnauthorizedError('User ID required');
      }

      const claim = await returnService.submitReturnClaim({
        ...req.body,
        userId,
      });

      sendCreated(res, { returnRequest: claim });
    } catch (error) {
      next(error);
    }
  },

  async updateReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.body.id || req.body.returnId || req.params.id;
      const { status, refundAmount, adminNotes } = req.body;
      const claim = await returnService.processReturnClaim(id, status, refundAmount, adminNotes);
      sendSuccess(res, { returnRequest: claim });
    } catch (error) {
      next(error);
    }
  },
};
