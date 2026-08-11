import { Router } from 'express';
import { cartController } from '../controllers/cartController';
import { optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addToCartSchema, updateCartSchema } from '../validators/cartValidator';

export const cartRoutes = Router();

cartRoutes.get('/', optionalAuthenticate, cartController.getCart);
cartRoutes.post('/', optionalAuthenticate, validate(addToCartSchema), cartController.addToCart);
cartRoutes.put('/', optionalAuthenticate, validate(updateCartSchema), cartController.updateCart);
cartRoutes.delete('/', optionalAuthenticate, cartController.removeFromCart);
cartRoutes.post('/clear', optionalAuthenticate, cartController.clearCart);
