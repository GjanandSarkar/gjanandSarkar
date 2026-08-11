import { Router } from 'express';
import { addressController } from '../controllers/addressController';
import { optionalAuthenticate, authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { saveAddressSchema, updateAddressSchema } from '../validators/addressValidator';

export const addressRoutes = Router();

addressRoutes.get('/', optionalAuthenticate, addressController.getAddresses);
addressRoutes.post('/', optionalAuthenticate, validate(saveAddressSchema), addressController.saveAddress);
addressRoutes.put('/:id', authenticate, validate(updateAddressSchema), addressController.updateAddress);
addressRoutes.delete('/:id', authenticate, addressController.deleteAddress);
addressRoutes.delete('/', optionalAuthenticate, addressController.deleteAddress);
