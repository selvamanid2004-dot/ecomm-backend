import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validateRequest } from '../validators/validate';
import { productQuerySchema } from '../validators/product.validator';

const router = Router();
const controller = new ProductController();

router.get('/', validateRequest({ query: productQuerySchema }), controller.getProducts);
router.post('/', controller.createProduct);
router.get('/featured', controller.getFeatured);
router.get('/related', controller.getRelated);
router.get('/:identifier', controller.getProductByIdentifier);

export default router;
