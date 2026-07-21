import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';

const router = Router();

router.use(authenticate);
router.use(companyGuard);

router.get('/attendance', reportsController.getAttendance);
router.get('/attendance/export', reportsController.exportAttendanceCsv);
router.get('/productivity', reportsController.getProductivity);
router.get('/tasks', reportsController.getTasks);
router.get('/ai-summary', reportsController.getAiAnalytics);

export default router;
