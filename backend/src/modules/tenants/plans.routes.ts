import { Router } from 'express';
import { plansController } from './plans.controller';
import { authenticate } from '../authentication/auth.middleware';
import { requireSuperAdmin } from '../authorization/authz.middleware';

const router = Router();

router.get('/', plansController.list);
router.post('/', authenticate, requireSuperAdmin, plansController.create);
router.patch('/:id', authenticate, requireSuperAdmin, plansController.update);
router.delete('/:id', authenticate, requireSuperAdmin, plansController.delete);

export default router;
