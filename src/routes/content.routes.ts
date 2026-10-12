import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';

const router = Router();
const contentCtrl = new ContentController();

// Public endpoint to read storefront content
router.get('/storefront', contentCtrl.getStorefrontContent);

export default router;
