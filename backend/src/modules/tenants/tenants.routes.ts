import { Router } from 'express';
import { tenantsController } from './tenants.controller';
import { authenticate } from '../authentication/auth.middleware';
import { requireSuperAdmin } from '../authorization/authz.middleware';

const router = Router();

router.post('/', tenantsController.create);
router.post('/companies/:companyId/subscribe', authenticate, tenantsController.subscribePlan);
router.get('/', authenticate, requireSuperAdmin, tenantsController.list);
router.patch('/:id/status', authenticate, requireSuperAdmin, tenantsController.updateStatus);
router.patch('/:id', authenticate, requireSuperAdmin, tenantsController.update);

router.get('/metrics', authenticate, requireSuperAdmin, tenantsController.getMetrics);
router.get('/audit-logs', authenticate, requireSuperAdmin, tenantsController.getAuditLogs);

export default router;
