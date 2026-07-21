import { Router } from 'express';
import { devicesController } from './devices.controller';

const router = Router();

router.post('/register', devicesController.register);
router.get('/', devicesController.list);

export default router;
