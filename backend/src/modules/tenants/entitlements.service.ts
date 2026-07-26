import { prisma } from '../../shared/database';
import { ForbiddenError } from '../../shared/errors';
import { Request, Response, NextFunction } from 'express';

export class EntitlementsService {
  /**
   * Resolves the company ID for a given user.
   */
  async resolveCompanyId(userId: string, tenantId: string): Promise<string | null> {
    const employee = await prisma.employee.findFirst({
      where: { userId, company: { tenantId } },
      select: { companyId: true },
    });

    if (employee) {
      return employee.companyId;
    }

    // Fallback: first company under this tenant
    const company = await prisma.company.findFirst({
      where: { tenantId },
      select: { id: true },
    });

    return company ? company.id : null;
  }

  /**
   * Checks if a company is entitled to use a specific feature key,
   * mapping module codes to database-seeded features.
   */
  async canUse(companyId: string, featureKey: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription || !subscription.plan) {
      return false;
    }

    const planFeatures = subscription.plan.features || [];
    const planModules = subscription.plan.modules || [];

    // Enterprise plan or all modules enabled bypasses feature locks
    if (planFeatures.includes('All Features') || planModules.length === 3) {
      return true;
    }

    // Module array checks
    if (['attendance', 'leave', 'hrm', 'departments', 'teams', 'timesheets'].includes(featureKey) && planModules.includes('HRM')) {
      return true;
    }
    if (['tasks', 'projects', 'reports', 'timesheets'].includes(featureKey) && planModules.includes('PROJECTS_TASKS')) {
      return true;
    }
    if (['tracking', 'screenshots', 'work-sessions', 'devices'].includes(featureKey) && planModules.includes('WORK_TRACKER')) {
      return true;
    }

    // Core HRM is enabled for any valid active plan
    if (featureKey === 'hrm') {
      return true;
    }

    // Map module codes to seeded plan feature string indicators
    let requiredSeededFeatures: string[] = [];
    switch (featureKey) {
      case 'attendance':
      case 'leave':
        requiredSeededFeatures = ['Attendance Tracking'];
        break;
      case 'tracking':
        requiredSeededFeatures = ['Basic Activity Monitoring', 'Detailed Activity Monitoring'];
        break;
      case 'screenshots':
        requiredSeededFeatures = ['Screenshots'];
        break;
      case 'tasks':
      case 'projects':
      case 'timesheets':
        requiredSeededFeatures = ['Task Management', 'Time Logging & Timesheets'];
        break;
      case 'reports':
        requiredSeededFeatures = ['Detailed Activity Monitoring'];
        break;
      default:
        requiredSeededFeatures = [featureKey];
    }

    return requiredSeededFeatures.some((sf) => planFeatures.includes(sf));
  }

  /**
   * Gets the numerical limit for a specific limit type under the company's active plan.
   */
  async getLimit(companyId: string, limitType: 'employees'): Promise<number> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription || !subscription.plan) {
      return 0; // No plan means 0 limit
    }

    if (limitType === 'employees') {
      return subscription.plan.employeeLimit;
    }

    return 0;
  }

  /**
   * Checks if a company is within the allowed threshold of a limit.
   */
  async checkLimit(companyId: string, limitType: 'employees', newCount: number): Promise<boolean> {
    const limit = await this.getLimit(companyId, limitType);
    return newCount <= limit;
  }
}

export const entitlementsService = new EntitlementsService();

/**
 * Middleware to require a specific subscription feature entitlement.
 */
export const requireEntitlement = (featureKey: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Super Admins are exempted from subscription/entitlement limits
    if (req.userRole === 'SUPER_ADMIN') {
      return next();
    }

    const { userId, tenantId } = req;
    if (!userId || !tenantId) {
      return next(new ForbiddenError('Access denied: Authentication context missing'));
    }

    try {
      const companyId = await entitlementsService.resolveCompanyId(userId, tenantId);
      if (!companyId) {
        return next(new ForbiddenError('Access denied: Unable to resolve company context'));
      }

      const hasAccess = await entitlementsService.canUse(companyId, featureKey);
      if (!hasAccess) {
        return next(
          new ForbiddenError(
            `Access denied: Your current subscription plan does not include the '${featureKey}' feature.`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
