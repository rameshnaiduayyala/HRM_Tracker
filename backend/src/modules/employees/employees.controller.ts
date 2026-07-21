import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { employeesService } from './employees.service';
import { ValidationError, BadRequestError, NotFoundError } from '../../shared/errors';

const createEmployeeSchema = z.object({
  employeeNum: z.string().min(2, 'Employee number is required'),
  companyId: z.string().uuid('Invalid company ID'),
  userId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  designation: z.string().optional(),
  
  // Optional User Registration Payload
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleName: z.enum(['MANAGER', 'EMPLOYEE', 'HR']).optional(),
});

const updateEmployeeSchema = z.object({
  employeeNum: z.string().min(2).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  designation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVE']).optional(),
  
  // Optional User Details Update
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export class EmployeesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const employees = await employeesService.getEmployeesByCompany(companyId);
      return res.status(200).json({
        status: 'success',
        data: { employees },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const employee = await employeesService.createEmployee(req.tenantId!, parsed.data);
      return res.status(201).json({
        status: 'success',
        data: { employee },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      // Resolve companyId parameter or body
      const companyId = req.body.companyId;
      if (!companyId) {
        return next(new BadRequestError('companyId is required in request body'));
      }

      const employee = await employeesService.updateEmployee(id, companyId, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { employee },
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }
      const employee = await employeesService.getEmployeeById(id, companyId);
      if (!employee) {
        return next(new NotFoundError('Employee profile not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { employee },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = (req.body.companyId || req.query.companyId) as string;
      if (!companyId) {
        return next(new BadRequestError('companyId is required'));
      }
      await employeesService.deleteEmployee(id, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Employee profile and user account deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async resetData(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await employeesService.resetEmployeeData(id);
      return res.status(200).json({
        status: 'success',
        message: 'Employee tracking data reset successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const employeesController = new EmployeesController();
