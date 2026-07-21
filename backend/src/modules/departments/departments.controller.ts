import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { departmentsService } from './departments.service';
import { ValidationError, BadRequestError, NotFoundError } from '../../shared/errors';

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  companyId: z.string().uuid('Invalid company ID'),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  companyId: z.string().uuid('Invalid company ID'),
});

export class DepartmentsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const departments = await departmentsService.list(companyId);
      return res.status(200).json({
        status: 'success',
        data: { departments },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const department = await departmentsService.create(
        parsed.data.companyId,
        parsed.data.name
      );
      return res.status(201).json({
        status: 'success',
        data: { department },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateDepartmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const department = await departmentsService.update(
        id,
        parsed.data.companyId,
        parsed.data.name
      );
      return res.status(200).json({
        status: 'success',
        data: { department },
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
      const department = await departmentsService.getById(id, companyId);
      if (!department) {
        return next(new NotFoundError('Department not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { department },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      await departmentsService.delete(id, companyId);
      return res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const departmentsController = new DepartmentsController();
