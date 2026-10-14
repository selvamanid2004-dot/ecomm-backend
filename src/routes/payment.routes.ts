import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();
const controller = new PaymentController();

router.get('/config', controller.getConfig);
router.post('/razorpay/order', optionalAuth, controller.createOrder);
router.post('/razorpay/verify', optionalAuth, controller.verifyPayment);

export default router;
