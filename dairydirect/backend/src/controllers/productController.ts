import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { sendCreated, sendSuccess } from '../utils/response';

export const productController = {
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string;
      const activeOnly = req.query.activeOnly !== undefined ? req.query.activeOnly === 'true' : false;
      const brand = req.query.brand as string;
      const isDealOfTheDay = req.query.isDealOfTheDay !== undefined ? req.query.isDealOfTheDay === 'true' : undefined;
      const search = req.query.search as string;
      const sellerId = req.query.sellerId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await productService.listProducts({
        category,
        activeOnly,
        brand,
        isDealOfTheDay,
        search,
        sellerId,
        limit,
        offset,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      sendSuccess(res, { product });
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      sendCreated(res, { product });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      sendSuccess(res, { product });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permanent = req.query.permanent === 'true';
      await productService.deleteProduct(req.params.id, permanent);
      sendSuccess(res, { message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
