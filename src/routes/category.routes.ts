import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();
const controller = new CategoryController();

router.get('/', controller.getAll);
router.get('/:slug', controller.getBySlug);

export default router;
