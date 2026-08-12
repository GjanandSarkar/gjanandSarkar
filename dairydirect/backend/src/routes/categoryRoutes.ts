import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

export const categoryRoutes = Router();

categoryRoutes.get('/', categoryController.listCategories);
categoryRoutes.post('/', authenticate, requireAdmin, categoryController.createCategory);
categoryRoutes.patch('/:id', authenticate, requireAdmin, categoryController.updateCategory);
categoryRoutes.put('/:id', authenticate, requireAdmin, categoryController.updateCategory);
categoryRoutes.delete('/:id', authenticate, requireAdmin, categoryController.deleteCategory);
