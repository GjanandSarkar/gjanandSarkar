import { Router } from 'express';
import { translationController } from '../controllers/translationController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

export const translationRoutes = Router();

translationRoutes.get('/', translationController.getTranslations);
translationRoutes.post('/', authenticate, requireAdmin, translationController.updateTranslations);
