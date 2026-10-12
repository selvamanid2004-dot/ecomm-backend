import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../validators/validate';
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '../validators/cart.validator';

const router = Router();
const controller = new CartController();

router.use(optionalAuth);

router.get('/', controller.getCart);
router.post('/items', validateRequest({ body: addToCartSchema }), controller.addItem);
router.put('/items/:itemId', validateRequest({ body: updateCartItemSchema }), controller.updateItemQuantity);
router.delete('/items/:itemId', controller.removeItem);
router.post('/apply-coupon', validateRequest({ body: applyCouponSchema }), controller.applyCoupon);
router.delete('/coupon', controller.removeCoupon);

export default router;
