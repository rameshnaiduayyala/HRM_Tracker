import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/database';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';

export type AppModuleName = 'HRM' | 'PROJECTS_TASKS' | 'WORK_TRACKER';

export const requireModule = (requiredModule: AppModuleName) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // SUPER_ADMIN has global access across all modules
      if (req.userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Find company associated with employee user or user's company
      const employee = await prisma.employee.findFirst({
        where: { userId: req.userId },
        include: {
          company: {
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                include: { plan: true },
              },
            },
          },
        },
      });

      if (!employee || !employee.company) {
        return next(new ForbiddenError('No company association found for this user account'));
      }

      const activeSubscription = employee.company.subscriptions[0];
      if (!activeSubscription || !activeSubscription.plan) {
        return next(new ForbiddenError('Company does not have an active plan subscription'));
      }

      const allowedModules = activeSubscription.plan.modules || [];
      if (!allowedModules.includes(requiredModule)) {
        return next(
          new ForbiddenError(
            `Access Denied: Your company plan (${activeSubscription.plan.name}) does not include the '${requiredModule}' module. Please upgrade your subscription.`
          )
        );
      }

      // Attach companyId to request object for easy downstream usage
      req.companyId = employee.companyId;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const checkSeatLimit = async (companyId: string) => {
  const activeSubscription = await prisma.subscription.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: { plan: true },
  });

  if (!activeSubscription) {
    throw new ForbiddenError('No active subscription found for company');
  }

  const currentEmployeeCount = await prisma.employee.count({
    where: { companyId, status: 'ACTIVE' },
  });

  const maxAllowed = Math.min(activeSubscription.userCount, activeSubscription.plan.employeeLimit);

  if (currentEmployeeCount >= maxAllowed) {
    throw new ForbiddenError(
      `Employee user limit reached (${currentEmployeeCount}/${maxAllowed} active seats). Please upgrade paid user seats in INR.`
    );
  }
};
