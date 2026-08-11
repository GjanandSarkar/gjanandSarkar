import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

export const notificationRoutes = Router();

notificationRoutes.get('/', authenticate, notificationController.getNotifications);
notificationRoutes.post('/', authenticate, notificationController.markRead);
