import { Router } from 'express';
import { attendanceController } from './attendance.controller';

const router = Router();

router.get('/status', attendanceController.status);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

export default router;
