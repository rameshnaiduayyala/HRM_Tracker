import { Router } from 'express';
import { timesheetsController } from './timesheets.controller';
import { authenticate } from '../authentication/auth.middleware';
import { requireEntitlement } from '../tenants/entitlements.service';

const router = Router();

router.use(authenticate);
router.use(requireEntitlement('timesheets'));

router.post('/', timesheetsController.submit);
router.get('/', timesheetsController.list);
router.get('/:id', timesheetsController.get);
router.post('/:id/review', timesheetsController.review);

export default router;
