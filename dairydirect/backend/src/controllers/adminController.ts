import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { sendCreated, sendSuccess } from '../utils/response';

export const adminController = {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, { stats });
    } catch (error) {
      next(error);
    }
  },

  async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string) || 'daily';
      const format = (req.query.format as string) || 'json';

      if (format === 'csv') {
        const csvData = await adminService.getReports({ period, format: 'csv' });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${period}.csv"`);
        res.status(200).send(csvData);
        return;
      }

      const result = await adminService.getReports({ period, format: 'json' });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = (req.query.filter as string) || 'all';
      const inventory = await adminService.getInventory(filter);
      sendSuccess(res, { inventory });
    } catch (error) {
      next(error);
    }
  },

  async updateInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updates = req.body.updates || [req.body];
      await adminService.updateInventory(updates, req.user?.userId);
      sendSuccess(res, { message: 'Inventory updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await adminService.listCustomers({ search, limit, offset });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.getSettings();
      sendSuccess(res, { settings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await adminService.updateSettings(req.body, req.user?.userId);
      sendSuccess(res, { settings, message: 'Settings updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getDeliverySlots(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slots = await adminService.getDeliverySlots();
      sendSuccess(res, { slots });
    } catch (error) {
      next(error);
    }
  },

  async createDeliverySlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await adminService.createDeliverySlot(req.body);
      sendCreated(res, { slot });
    } catch (error) {
      next(error);
    }
  },

  async updateDeliverySlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await adminService.updateDeliverySlot(req.params.id, req.body);
      sendSuccess(res, { slot });
    } catch (error) {
      next(error);
    }
  },

  async deleteDeliverySlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteDeliverySlot(req.params.id);
      sendSuccess(res, { message: 'Delivery slot deleted' });
    } catch (error) {
      next(error);
    }
  },
};
