import { Router } from 'express';
import { CandidatesController } from './candidates.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();
const controller = new CandidatesController();

// Public routes for candidate offer portal
router.get('/portal/offer/:token', controller.getOfferDetailsByToken.bind(controller));
router.post('/portal/offer/:token/respond', controller.respondToOffer.bind(controller));

// Authenticated HR / Admin routes
router.get('/', authenticate, controller.listCandidates.bind(controller));
router.post('/', authenticate, controller.createCandidate.bind(controller));
// Public / Token-authenticated document render route
router.get('/:id/offer-letter', controller.renderOfferLetterHTML.bind(controller));
router.post('/:id/convert', authenticate, controller.convertToEmployee.bind(controller));
router.patch('/tasks/:taskId', authenticate, controller.updateOnboardingTask.bind(controller));

export default router;
