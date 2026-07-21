import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { leaveService } from './leave.service';
import { ValidationError, BadRequestError, NotFoundError } from '../../shared/errors';

const createLeaveTypeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyId: z.string().uuid('Invalid company ID'),
  allowedDays: z.number().int().min(1, 'Allowed days must be at least 1'),
  isPaid: z.boolean().default(true),
});

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid('Invalid leave type ID'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date format' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date format' }),
  reason: z.string().optional(),
});

const reviewLeaveRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

const createHolidaySchema = z.object({
  name: z.string().min(2, 'Holiday name is required'),
  companyId: z.string().uuid('Invalid company ID'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
});

export class LeaveController {
  // --- Leave Types ---
  async listTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const leaveTypes = await leaveService.listTypes(companyId);
      return res.status(200).json({
        status: 'success',
        data: { leaveTypes },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createType(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createLeaveTypeSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const leaveType = await leaveService.createType(
        parsed.data.companyId,
        parsed.data.name,
        parsed.data.allowedDays,
        parsed.data.isPaid
      );
      return res.status(201).json({
        status: 'success',
        data: { leaveType },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }
      const leaveType = await leaveService.getType(id, companyId);
      if (!leaveType) {
        return next(new NotFoundError('Leave type not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { leaveType },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = createLeaveTypeSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }
      const leaveType = await leaveService.updateType(
        id,
        parsed.data.companyId,
        parsed.data.name,
        parsed.data.allowedDays,
        parsed.data.isPaid
      );
      return res.status(200).json({
        status: 'success',
        data: { leaveType },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteType(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }
      await leaveService.deleteType(id, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Leave type deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Leave Requests ---
  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.query.employeeId as string;
      const companyId = req.query.companyId as string;

      const requests = await leaveService.listRequests({ employeeId, companyId });
      return res.status(200).json({
        status: 'success',
        data: { requests },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createLeaveRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const request = await leaveService.createRequest(
        req.userId!,
        parsed.data.leaveTypeId,
        new Date(parsed.data.startDate),
        new Date(parsed.data.endDate),
        parsed.data.reason
      );
      return res.status(201).json({
        status: 'success',
        data: { request },
      });
    } catch (error) {
      return next(error);
    }
  }

  async reviewRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = reviewLeaveRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const request = await leaveService.reviewRequest(
        id,
        req.userId!,
        parsed.data.status,
        parsed.data.reviewNote
      );
      return res.status(200).json({
        status: 'success',
        data: { request },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }
      const request = await leaveService.getRequest(id, companyId);
      if (!request) {
        return next(new NotFoundError('Leave request not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { request },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }
      await leaveService.deleteRequest(id, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Leave request deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Leave Balances ---
  async getMyBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await leaveService.getMyBalances(req.userId!);
      return res.status(200).json({
        status: 'success',
        data: { balances },
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Holidays ---
  async listHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const holidays = await leaveService.listHolidays(companyId);
      return res.status(200).json({
        status: 'success',
        data: { holidays },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createHolidaySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const holiday = await leaveService.createHoliday(
        parsed.data.companyId,
        parsed.data.name,
        new Date(parsed.data.date)
      );
      return res.status(201).json({
        status: 'success',
        data: { holiday },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      await leaveService.deleteHoliday(id, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Holiday deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const leaveController = new LeaveController();
