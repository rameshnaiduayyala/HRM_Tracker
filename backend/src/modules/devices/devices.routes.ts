import { Router } from 'express';
import { devicesController } from './devices.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/register', devicesController.register);
router.get('/', devicesController.list);

export default router;
