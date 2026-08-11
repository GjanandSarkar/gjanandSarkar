import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { requireSellerOrAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { placeOrderSchema, updateOrderStatusSchema } from '../validators/orderValidator';

export const orderRoutes = Router();

orderRoutes.get('/', optionalAuthenticate, orderController.getOrders);
orderRoutes.post('/', optionalAuthenticate, validate(placeOrderSchema), orderController.placeOrder);
orderRoutes.post('/place', optionalAuthenticate, validate(placeOrderSchema), orderController.placeOrder);
orderRoutes.get('/:id', optionalAuthenticate, orderController.getOrderById);
orderRoutes.put('/:id', authenticate, requireSellerOrAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
