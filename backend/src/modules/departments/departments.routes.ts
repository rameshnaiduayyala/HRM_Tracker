import { Router } from 'express';
import { departmentsController } from './departments.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';
import { requireEntitlement } from '../tenants/entitlements.service';

const router = Router();

router.use(authenticate);
router.use(companyGuard);
router.use(requireEntitlement('hrm'));

router.get('/', departmentsController.list);
router.post('/', departmentsController.create);
router.get('/:id', departmentsController.get);
router.put('/:id', departmentsController.update);
router.delete('/:id', departmentsController.delete);

export default router;
