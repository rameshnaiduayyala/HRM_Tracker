import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { requireEntitlement } from '../tenants/entitlements.service';

const router = Router();

router.use(requireEntitlement('attendance'));

router.get('/status', attendanceController.status);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

export default router;
