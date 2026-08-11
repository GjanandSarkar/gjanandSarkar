import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate } from '../middleware/auth';
import { requireSellerOrAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/productValidator';

export const productRoutes = Router();

productRoutes.get('/', productController.listProducts);
productRoutes.get('/:id', productController.getProduct);
productRoutes.post('/', authenticate, requireSellerOrAdmin, validate(createProductSchema), productController.createProduct);
productRoutes.put('/:id', authenticate, requireSellerOrAdmin, validate(updateProductSchema), productController.updateProduct);
productRoutes.delete('/:id', authenticate, requireSellerOrAdmin, productController.deleteProduct);
