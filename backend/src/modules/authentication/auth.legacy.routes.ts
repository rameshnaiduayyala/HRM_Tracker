import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post('/login', authController.legacyLogin);

export default router;
