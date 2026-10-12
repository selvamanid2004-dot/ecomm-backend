import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../validators/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';
import { authenticateJwt } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const controller = new AuthController();

router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), controller.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), controller.login);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), controller.refreshToken);
router.get('/profile', authenticateJwt, controller.getProfile);

export default router;
