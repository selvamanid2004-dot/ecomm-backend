import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJwt, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new CustomerController();

router.use(authenticateJwt);
router.use(requireRoles('customer', 'admin', 'manager'));

router.get('/addresses', controller.getAddresses);
router.post('/addresses', controller.addAddress);
router.delete('/addresses/:addressId', controller.deleteAddress);

export default router;
