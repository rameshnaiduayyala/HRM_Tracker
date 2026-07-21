import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';

const router = Router();

router.use(authenticate);
router.use(companyGuard);

// Leave Types
router.get('/types', leaveController.listTypes);
router.post('/types', leaveController.createType);
router.get('/types/:id', leaveController.getType);
router.put('/types/:id', leaveController.updateType);
router.delete('/types/:id', leaveController.deleteType);

// Leave Requests
router.get('/requests', leaveController.listRequests);
router.post('/requests', leaveController.createRequest);
router.get('/requests/:id', leaveController.getRequest);
router.put('/requests/:id/review', leaveController.reviewRequest);
router.delete('/requests/:id', leaveController.deleteRequest);

// Leave Balances
router.get('/balances', leaveController.getMyBalances);

// Holidays
router.get('/holidays', leaveController.listHolidays);
router.post('/holidays', leaveController.createHoliday);
router.delete('/holidays/:id', leaveController.deleteHoliday);

export default router;
