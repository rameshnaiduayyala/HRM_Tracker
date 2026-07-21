import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { plansService } from './plans.service';
import { ValidationError } from '../../shared/errors';

const planSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().min(0, 'Price must be positive'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  employeeLimit: z.number().int().min(1).optional(),
  features: z.array(z.string()).optional(),
});

export class PlansController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await plansService.listPlans();
      return res.status(200).json({
        status: 'success',
        data: { plans },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = planSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const plan = await plansService.createPlan(parsed.data);
      return res.status(201).json({
        status: 'success',
        data: { plan },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = planSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const plan = await plansService.updatePlan(req.params.id, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { plan },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await plansService.deletePlan(req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'Plan deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}
export const plansController = new PlansController();
