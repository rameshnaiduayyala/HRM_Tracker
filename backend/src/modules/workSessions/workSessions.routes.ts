import { Router } from 'express';
import { workSessionsController } from './workSessions.controller';
import { requireEntitlement } from '../tenants/entitlements.service';

const router = Router();

router.use(requireEntitlement('tracking'));

router.post('/start', workSessionsController.start);
router.post('/stop', workSessionsController.stop);
router.post('/update-reason', workSessionsController.updateStopReason);
router.post('/heartbeat', workSessionsController.heartbeat);
router.post('/screenshot', workSessionsController.screenshot);
router.get('/profile', workSessionsController.profile);
router.get('/config', workSessionsController.config);

export default router;
