import { Router } from 'express';
import authRoutes from '../modules/authentication/auth.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import workSessionsRoutes from '../modules/workSessions/workSessions.routes';
import devicesRoutes from '../modules/devices/devices.routes';

const router = Router();

// Mount standard modules as legacy routes for the desktop agent
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/work-sessions', workSessionsRoutes);
router.use('/devices', devicesRoutes);

export default router;
