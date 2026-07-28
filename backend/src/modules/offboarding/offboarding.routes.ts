import { Router } from 'express';
import { OffboardingController } from './offboarding.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();
const controller = new OffboardingController();

router.get('/', authenticate, controller.listRecords.bind(controller));
router.post('/initiate', authenticate, controller.initiateOffboarding.bind(controller));
router.patch('/:id/clearance', authenticate, controller.updateClearance.bind(controller));
router.post('/:id/complete', authenticate, controller.completeOffboardingAndDeactivate.bind(controller));
router.get('/:id/relieving-letter', controller.renderRelievingLetterHTML.bind(controller));
router.get('/:id/experience-letter', controller.renderExperienceLetterHTML.bind(controller));

export default router;
