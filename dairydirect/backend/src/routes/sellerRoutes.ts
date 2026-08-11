import { Router } from 'express';
import { sellerController } from '../controllers/sellerController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createSellerSchema,
  submitInquirySchema,
  updateInquirySchema,
} from '../validators/sellerValidator';

export const sellerRoutes = Router();

sellerRoutes.get('/', sellerController.listSellers);
sellerRoutes.post('/', optionalAuthenticate, validate(createSellerSchema), sellerController.createSeller);

sellerRoutes.get('/inquiries', optionalAuthenticate, sellerController.getInquiries);
sellerRoutes.post('/inquiries', optionalAuthenticate, validate(submitInquirySchema), sellerController.submitInquiry);
sellerRoutes.patch('/inquiries', authenticate, requireAdmin, validate(updateInquirySchema), sellerController.updateInquiry);
