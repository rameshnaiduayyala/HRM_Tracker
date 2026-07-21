import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { companiesService } from './companies.service';
import { ValidationError, NotFoundError } from '../../shared/errors';

const createCompanySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export class CompaniesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await companiesService.getCompaniesByTenant(req.tenantId!);
      return res.status(200).json({
        status: 'success',
        data: { companies },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const company = await companiesService.createCompany(req.tenantId!, parsed.data.name);
      return res.status(201).json({
        status: 'success',
        data: { company },
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const company = await companiesService.getCompanyById(req.tenantId!, id);
      if (!company) {
        return next(new NotFoundError('Company not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { company },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = createCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }
      const company = await companiesService.updateCompany(id, req.tenantId!, parsed.data.name);
      return res.status(200).json({
        status: 'success',
        data: { company },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await companiesService.deleteCompany(id, req.tenantId!);
      return res.status(200).json({
        status: 'success',
        message: 'Company deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const companiesController = new CompaniesController();
