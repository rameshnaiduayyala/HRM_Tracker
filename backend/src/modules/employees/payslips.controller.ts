import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { payslipsService } from './payslips.service';
import { ValidationError } from '../../shared/errors';

const createPayslipSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  month: z.string().min(3, 'Month is required'),
  baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  allowance: z.number().min(0, 'Allowance must be non-negative').optional(),
  deductions: z.number().min(0, 'Deductions must be non-negative').optional(),
});

export class PayslipsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.query.companyId as string) || (req.headers['x-company-id'] as string);
      if (!companyId) {
        throw new Error('companyId query parameter is required');
      }

      const payslips = await payslipsService.listPayslips(companyId);
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

      const payslip = await payslipsService.createPayslip({
        employeeId: parsed.data.employeeId,
        month: parsed.data.month,
        baseSalary: parsed.data.baseSalary,
        allowance: parsed.data.allowance || 0,
        deductions: parsed.data.deductions || 0,
      });

      return res.status(201).json({
        status: 'success',
        data: { payslip },
      });
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
