import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

export const wishlistRoutes = Router();

wishlistRoutes.get('/', authenticate, wishlistController.getWishlist);
wishlistRoutes.post('/', authenticate, wishlistController.toggleWishlist);
wishlistRoutes.delete('/:productId', authenticate, wishlistController.removeFromWishlist);
