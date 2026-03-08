import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

import { authenticate } from '../../../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);
router.get('/me', authenticate, controller.getMe);

export default router;
