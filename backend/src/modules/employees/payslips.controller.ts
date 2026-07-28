import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { payslipsService } from './payslips.service';
import { ValidationError, NotFoundError } from '../../shared/errors';

const createPayslipSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  month: z.string().min(3, 'Month is required'),
  baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  hra: z.number().min(0).optional(),
  specialAllowance: z.number().min(0).optional(),
  conveyance: z.number().min(0).optional(),
  pfDeduction: z.number().min(0).optional(),
  taxDeduction: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
});

export class PayslipsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.query.companyId as string) || (req.headers['x-company-id'] as string);
      const employeeId = req.query.employeeId as string | undefined;

      if (!companyId || companyId === 'undefined') {
        return res.status(200).json({
          status: 'success',
          data: { payslips: [] },
        });
      }

      const payslips = await payslipsService.listPayslips(companyId, employeeId);
      return res.status(200).json({
        status: 'success',
        data: { payslips },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createPayslipSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const payslip = await payslipsService.createPayslip(parsed.data);

      return res.status(201).json({
        status: 'success',
        data: { payslip },
      });
    } catch (error) {
      return next(error);
    }
  }

  async renderHTML(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const html = await payslipsService.renderPayslipHTML(id);
      if (!html) throw new NotFoundError('Payslip not found');

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await payslipsService.deletePayslip(id);
      return res.status(200).json({
        status: 'success',
        message: 'Payslip deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const payslipsController = new PayslipsController();
