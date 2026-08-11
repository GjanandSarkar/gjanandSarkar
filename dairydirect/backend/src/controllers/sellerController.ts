import { Request, Response, NextFunction } from 'express';
import { sellerService } from '../services/sellerService';
import { sendCreated, sendSuccess } from '../utils/response';

export const sellerController = {
  async listSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const slug = req.query.slug as string;

      if (slug) {
        const seller = await sellerService.getSellerBySlug(slug);
        sendSuccess(res, { seller });
        return;
      }

      if (userId) {
        const seller = await sellerService.getSellerByUserId(userId);
        sendSuccess(res, { seller, store: seller });
        return;
      }

      const sellers = await sellerService.listSellers({});
      sendSuccess(res, { sellers });
    } catch (error) {
      next(error);
    }
  },

  async createSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      const seller = await sellerService.createSellerProfile({
        ...req.body,
        userId,
      });
      sendCreated(res, { seller });
    } catch (error) {
      next(error);
    }
  },

  async submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body.userId || req.user?.userId;
      const inquiry = await sellerService.submitInquiry({
        ...req.body,
        userId,
      });
      sendCreated(res, { inquiry });
    } catch (error) {
      next(error);
    }
  },

  async getInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const status = req.query.status as any;
      const inquiries = await sellerService.getInquiries({ userId, status });
      sendSuccess(res, { inquiries });
    } catch (error) {
      next(error);
    }
  },

  async updateInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.body.inquiryId || req.body.id || req.params.id;
      const { status, adminNotes } = req.body;
      const inquiry = await sellerService.updateInquiryStatus(id, status, adminNotes);
      sendSuccess(res, { inquiry });
    } catch (error) {
      next(error);
    }
  },
};
