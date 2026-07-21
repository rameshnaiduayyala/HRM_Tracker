import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', announcementsController.list);
router.post('/', announcementsController.create);
router.get('/:id', announcementsController.get);
router.put('/:id', announcementsController.update);
router.delete('/:id', announcementsController.delete);

export default router;
