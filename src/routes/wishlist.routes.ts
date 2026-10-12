import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();
const controller = new WishlistController();

router.use(optionalAuth);

router.get('/', controller.getWishlist);
router.post('/items', controller.addItem);
router.delete('/items/:productId', controller.removeItem);

export default router;
