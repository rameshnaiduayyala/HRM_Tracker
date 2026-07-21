import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.list);
router.put('/:id/read', notificationsController.markAsRead);
router.put('/read-all', notificationsController.markAllAsRead);

export default router;
