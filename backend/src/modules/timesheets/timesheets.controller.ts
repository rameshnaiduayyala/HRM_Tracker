import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { timesheetsService } from './timesheets.service';
import { prisma } from '../../shared/database';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../shared/errors';
import { entitlementsService } from '../tenants/entitlements.service';

const submitSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
});

export class TimesheetsController {
  private async getEmployeeId(userId: string): Promise<string> {
    const employee = await prisma.employee.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (!employee) {
      throw new UnauthorizedError('User does not have an employee profile associated');
    }
    return employee.id;
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const employeeId = await this.getEmployeeId(req.userId!);
      const timesheet = await timesheetsService.submitTimesheet(
        employeeId,
        new Date(parsed.data.startDate),
        new Date(parsed.data.endDate)
      );

      return res.status(201).json({
        status: 'success',
        data: { timesheet },
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, userId } = req;
      const companyId = await entitlementsService.resolveCompanyId(userId!, tenantId!);
      if (!companyId) {
        return next(new NotFoundError('Unable to resolve company context'));
      }

      const filters: any = {};
      if (req.query.employeeId) filters.employeeId = req.query.employeeId as string;
      if (req.query.status) filters.status = req.query.status as string;

      // Regular employees can only see their own timesheets
      if (req.userRole === 'EMPLOYEE') {
        const employeeId = await this.getEmployeeId(userId!);
        filters.employeeId = employeeId;
      }

      const timesheets = await timesheetsService.listTimesheets(companyId, filters);
      return res.status(200).json({
        status: 'success',
        data: { timesheets },
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tenantId, userId } = req;
      const companyId = await entitlementsService.resolveCompanyId(userId!, tenantId!);
      if (!companyId) {
        return next(new NotFoundError('Unable to resolve company context'));
      }

      const timesheet = await timesheetsService.getTimesheetById(id, companyId);
      
      // Enforce read boundaries
      if (req.userRole === 'EMPLOYEE') {
        const employeeId = await this.getEmployeeId(userId!);
        if (timesheet.employeeId !== employeeId) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied: You can only view your own timesheets',
          });
        }
      }

      return res.status(200).json({
        status: 'success',
        data: { timesheet },
      });
    } catch (error) {
      return next(error);
    }
  }

  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = reviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const { tenantId, userId, userRole } = req;
      if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'HR'].includes(userRole || '')) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied: Reviewer privilege required',
        });
      }

      const companyId = await entitlementsService.resolveCompanyId(userId!, tenantId!);
      if (!companyId) {
        return next(new NotFoundError('Unable to resolve company context'));
      }

      const reviewerEmployeeId = await this.getEmployeeId(userId!);
      const timesheet = await timesheetsService.reviewTimesheet(
        id,
        companyId,
        reviewerEmployeeId,
        parsed.data.status,
        parsed.data.comments
      );

      return res.status(200).json({
        status: 'success',
        data: { timesheet },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const timesheetsController = new TimesheetsController();
