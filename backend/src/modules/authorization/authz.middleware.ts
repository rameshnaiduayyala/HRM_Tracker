import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/database';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors';

export const requirePermission = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userId || !req.tenantId) {
      return next(new UnauthorizedError('Authentication context is missing'));
    }

    // ADMIN role bypasses permissions check
    if (req.userRole === 'ADMIN') {
      return next();
    }

    const user = await prisma.user.findFirst({
      where: { id: req.userId, tenantId: req.tenantId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return next(new ForbiddenError('Access denied: no role assigned'));
    }

    const hasPermission = user.role.permissions.some(
      (rp: any) => rp.permission.action === action
    );

    if (!hasPermission) {
      return next(new ForbiddenError(`Access denied: missing permission '${action}'`));
    }

    next();
  };
};

export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.userRole !== 'SUPER_ADMIN') {
    return next(new ForbiddenError('Access denied: Super Admin privilege required'));
  }
  return next();
};
