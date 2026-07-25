import { Router } from 'express';
import { teamsController } from './teams.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';
import { requireEntitlement } from '../tenants/entitlements.service';

const router = Router();

router.use(authenticate);
router.use(companyGuard);
router.use(requireEntitlement('hrm'));

router.get('/', teamsController.list);
router.post('/', teamsController.create);
router.get('/:id', teamsController.get);
router.put('/:id', teamsController.update);
router.delete('/:id', teamsController.delete);

export default router;
