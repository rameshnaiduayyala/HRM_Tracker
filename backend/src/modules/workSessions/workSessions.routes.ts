import { Router } from 'express';
import { workSessionsController } from './workSessions.controller';

const router = Router();

router.post('/start', workSessionsController.start);
router.post('/stop', workSessionsController.stop);
router.post('/heartbeat', workSessionsController.heartbeat);
router.post('/screenshot', workSessionsController.screenshot);

export default router;
