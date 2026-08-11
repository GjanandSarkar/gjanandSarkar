import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';
import { sendCreated, sendSuccess } from '../utils/response';
import { OrderStatus } from '../models/order';

export const orderController = {
  async placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderData = req.body.orderData || req.body;
      const userId = orderData.userId || req.user?.userId || null;

      const result = await orderService.placeOrder({
        ...orderData,
        userId,
      });

      sendCreated(res, { orderId: result.order.id, order: result.order });
    } catch (error) {
      next(error);
    }
  },

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'admin' && req.query.admin === 'true';
      const userId = req.user?.userId || (req.query.userId as string);
      const status = req.query.status as OrderStatus;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const singleId = req.query.id as string;
      if (singleId) {
        const order = await orderService.getOrderById(singleId, userId, isAdmin);
        sendSuccess(res, { order, orders: [order] });
        return;
      }

      const result = await orderService.listOrders({
        userId,
        status,
        limit,
        offset,
        isAdmin,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'admin';
      const order = await orderService.getOrderById(req.params.id, req.user?.userId, isAdmin);
      sendSuccess(res, { order });
    } catch (error) {
      next(error);
    }
  },

  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, paymentStatus } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status, paymentStatus);
      sendSuccess(res, { order });
    } catch (error) {
      next(error);
    }
  },
};
