import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { tenantsService } from './tenants.service';
import { ValidationError } from '../../shared/errors';

const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase alphanumeric characters and hyphens'),
  adminEmail: z.string().email('Invalid administrator email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  adminFirstName: z.string().min(1, 'First name is required').optional(),
  adminLastName: z.string().min(1, 'Last name is required').optional(),
  planId: z.string().optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  adminEmail: z.string().email('Invalid administrator email address').optional(),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  adminFirstName: z.string().min(1, 'First name is required').optional(),
  adminLastName: z.string().min(1, 'Last name is required').optional(),
  planId: z.string().optional(),
});

export class TenantsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      // If registered by a SUPER_ADMIN, mark it as ACTIVE. Otherwise, it is PENDING approval.
      const status = req.userRole === 'SUPER_ADMIN' ? 'ACTIVE' : 'PENDING';
      const onboardingResult = await tenantsService.createTenant({ ...parsed.data, status });
      return res.status(201).json({
        status: 'success',
        data: onboardingResult,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const tenant = await tenantsService.updateTenant(id, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { tenant },
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await tenantsService.listTenants();
      return res.status(200).json({
        status: 'success',
        data: { tenants },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return next(new ValidationError({ status: { _errors: ['Invalid status. Must be ACTIVE or INACTIVE'] } }));
      }

      const tenant = await tenantsService.updateTenantStatus(id, status);
      return res.status(200).json({
        status: 'success',
        data: { tenant },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await tenantsService.getPlatformMetrics();
      return res.status(200).json({
        status: 'success',
        data: metrics,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAuditLogs(_req: Request, res: Response, next: NextFunction) {
    try {
      const auditLogs = await tenantsService.getAuditLogs();
      return res.status(200).json({
        status: 'success',
        data: { auditLogs },
      });
    } catch (error) {
      return next(error);
    }
  }
  async subscribePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const { planId } = req.body;
      if (!planId) {
        return next(new ValidationError({ planId: { _errors: ['planId is required'] } }));
      }

      const subscription = await tenantsService.activateSubscription(companyId, planId);
      return res.status(200).json({
        status: 'success',
        data: { subscription },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const tenantsController = new TenantsController();
