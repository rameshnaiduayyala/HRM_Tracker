import { Router } from 'express';
import { authController } from './auth.controller';

import { authenticate } from './auth.middleware';

const router = Router();

router.post('/register', authenticate, authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
