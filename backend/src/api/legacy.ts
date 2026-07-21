import { Router } from 'express';
import { legacyAuthenticate } from '../modules/authentication/legacyAuth.middleware';
import legacyAuthRoutes from '../modules/authentication/auth.legacy.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import workSessionsRoutes from '../modules/workSessions/workSessions.routes';
import devicesRoutes from '../modules/devices/devices.routes';

const router = Router();

router.use('/auth', legacyAuthRoutes);

router.use(legacyAuthenticate);
router.use('/attendance', attendanceRoutes);
router.use('/work-sessions', workSessionsRoutes);
router.use('/devices', devicesRoutes);

export default router;
