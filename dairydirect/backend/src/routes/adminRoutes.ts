import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { returnController } from '../controllers/returnController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { updateInventorySchema, updateSettingsSchema } from '../validators/adminValidator';

export const adminRoutes = Router();

// Protect all admin endpoints with authenticate + requireAdmin
adminRoutes.use(authenticate, requireAdmin);

// Dashboard Statistics & BI
adminRoutes.get('/stats', adminController.getStats);

// Sales Reports & CSV Export
adminRoutes.get('/reports', adminController.getReports);

// Inventory Matrix & Stock Updates
adminRoutes.get('/inventory', adminController.getInventory);
adminRoutes.put('/inventory', validate(updateInventorySchema), adminController.updateInventory);

// Customers Management
adminRoutes.get('/customers', adminController.getCustomers);

// Business Settings
adminRoutes.get('/settings', adminController.getSettings);
adminRoutes.put('/settings', validate(updateSettingsSchema), adminController.updateSettings);

// Delivery Slots
adminRoutes.get('/delivery-slots', adminController.getDeliverySlots);
adminRoutes.post('/delivery-slots', adminController.createDeliverySlot);
adminRoutes.put('/delivery-slots/:id', adminController.updateDeliverySlot);
adminRoutes.delete('/delivery-slots/:id', adminController.deleteDeliverySlot);

// Freshness Returns
adminRoutes.get('/returns', returnController.listReturns);
adminRoutes.post('/returns', returnController.submitReturn);
adminRoutes.put('/returns', returnController.updateReturn);
adminRoutes.put('/returns/:id', returnController.updateReturn);
