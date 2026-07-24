import { Router } from 'express';
import { workSessionsController } from './workSessions.controller';

const router = Router();

router.post('/start', workSessionsController.start);
router.post('/stop', workSessionsController.stop);
router.post('/update-reason', workSessionsController.updateStopReason);
router.post('/heartbeat', workSessionsController.heartbeat);
router.post('/screenshot', workSessionsController.screenshot);
router.get('/profile', workSessionsController.profile);

export default router;
