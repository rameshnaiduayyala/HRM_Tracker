import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', attendanceController.status);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

export default router;
