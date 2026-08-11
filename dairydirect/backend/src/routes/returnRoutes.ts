import { Router } from 'express';
import { returnController } from '../controllers/returnController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { submitReturnSchema, updateReturnSchema } from '../validators/returnValidator';

export const returnRoutes = Router();

returnRoutes.get('/', optionalAuthenticate, returnController.listReturns);
returnRoutes.post('/', optionalAuthenticate, validate(submitReturnSchema), returnController.submitReturn);
returnRoutes.put('/:id', authenticate, requireAdmin, validate(updateReturnSchema), returnController.updateReturn);
returnRoutes.put('/', authenticate, requireAdmin, validate(updateReturnSchema), returnController.updateReturn);
