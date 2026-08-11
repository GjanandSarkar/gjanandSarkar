import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import { sendSuccess } from '../utils/response';

export const paymentController = {
  async createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.body.orderId;
      const result = await paymentService.createRazorpayOrder(orderId, req.user?.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.verifyPayment(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      await paymentService.handleWebhook(rawBody, signature);
      sendSuccess(res, { status: 'ok' });
    } catch (error) {
      next(error);
    }
  },
};
