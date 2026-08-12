import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { uploadSingleImage } from '../middleware/upload';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

export const uploadRoutes = Router();

// Generic image upload (handles multipart form or JSON body)
uploadRoutes.post(
  '/image',
  optionalAuthenticate,
  uploadSingleImage('image'),
  uploadController.uploadImage
);

// User profile avatar upload (authenticated)
uploadRoutes.post(
  '/avatar',
  authenticate,
  uploadSingleImage('image'),
  uploadController.uploadAvatar
);

// Category image upload (admin category folder: /gjanandSarkar/admin/categories)
uploadRoutes.post(
  '/category',
  optionalAuthenticate,
  uploadSingleImage('image'),
  uploadController.uploadCategory
);
uploadRoutes.post(
  '/category/:categoryId',
  optionalAuthenticate,
  uploadSingleImage('image'),
  uploadController.uploadCategory
);


// Product image upload (admin / seller)
uploadRoutes.post(
  '/product/:productId',
  optionalAuthenticate,
  uploadSingleImage('image'),
  uploadController.uploadProductImage
);

// Seller logo or banner upload
uploadRoutes.post(
  '/seller/:sellerId/:type',
  optionalAuthenticate,
  uploadSingleImage('image'),
  uploadController.uploadSellerImage
);

// Return request proof image upload
uploadRoutes.post(
  '/return/:returnId',
  authenticate,
  uploadSingleImage('image'),
  uploadController.uploadReturnImage
);

// Direct client-side ImageKit auth signature endpoint
uploadRoutes.get('/auth', uploadController.getAuthParams);

// Delete uploaded image from ImageKit
uploadRoutes.delete('/:fileId', optionalAuthenticate, uploadController.deleteImage);
