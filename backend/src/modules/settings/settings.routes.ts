import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../authentication/auth.middleware';
import { companyGuard } from '../../shared/middlewares/companyGuard';

const router = Router();

router.use(authenticate);
router.use(companyGuard);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
