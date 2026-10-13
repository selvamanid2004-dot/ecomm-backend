import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { optionalAuth, authenticateJwt } from '../middleware/auth.middleware';
import { validateRequest } from '../validators/validate';
import { checkoutSchema } from '../validators/order.validator';

const router = Router();
const controller = new OrderController();

router.post('/checkout', optionalAuth, validateRequest({ body: checkoutSchema }), controller.createOrder);
router.get('/my-orders', optionalAuth, controller.getMyOrders);
router.get('/:id', optionalAuth, controller.getOrderById);

export default router;
