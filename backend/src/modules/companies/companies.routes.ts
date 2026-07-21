import { Router } from 'express';
import { companiesController } from './companies.controller';
import { authenticate } from '../authentication/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', companiesController.list);
router.post('/', companiesController.create);
router.get('/:id', companiesController.get);
router.put('/:id', companiesController.update);
router.delete('/:id', companiesController.delete);

export default router;
