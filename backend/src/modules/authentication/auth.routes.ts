import { Router } from 'express';
import { authController } from './auth.controller';

import { authenticate } from './auth.middleware';

const router = Router();

router.post('/register', authenticate, authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
