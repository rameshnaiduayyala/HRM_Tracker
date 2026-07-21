import { Router } from 'express';
import { employeesController } from './employees.controller';
import { payslipsController } from './payslips.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';

const router = Router();

router.use(authenticate);
router.use(companyGuard);

router.get('/payslips', payslipsController.list);
router.post('/payslips', payslipsController.create);
router.delete('/payslips/:id', payslipsController.delete);

router.get('/', employeesController.list);
router.post('/', employeesController.create);
router.get('/:id', employeesController.get);
router.patch('/:id', employeesController.update);
router.delete('/:id', employeesController.delete);
router.post('/:id/reset', employeesController.resetData);

export default router;
