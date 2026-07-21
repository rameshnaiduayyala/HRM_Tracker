import { Router } from 'express';
import { workSessionsController } from './workSessions.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/start', workSessionsController.start);
router.post('/stop', workSessionsController.stop);
router.post('/heartbeat', workSessionsController.heartbeat);
router.post('/screenshot', workSessionsController.screenshot);

export default router;
