import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { ForbiddenError } from '../errors';

const isUuid = (val: any): val is string => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export const companyGuard = async (req: Request, _res: Response, next: NextFunction) => {
  // Super Admin bypasses company tenant check
  if (req.userRole === 'SUPER_ADMIN') {
    return next();
  }

  const tenantId = req.tenantId;
  if (!tenantId) {
    return next();
  }

  try {
    // 1. Resolve companyId from various possible inputs
    let companyId = (req.query.companyId as string) || (req.body.companyId as string);

    if (companyId && isUuid(companyId)) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { tenantId: true },
      });
      if (company && company.tenantId !== tenantId) {
        return next(new ForbiddenError('Access denied: Company does not belong to your tenant'));
      }
    }

    // 2. Resolve projectId
    let projectId = (req.query.projectId as string) || (req.body.projectId as string);
    if (req.path.includes('/projects/') && isUuid(req.params.id)) {
      projectId = req.params.id;
    }

    if (projectId && isUuid(projectId)) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { company: { select: { tenantId: true } } },
      });
      if (project && project.company.tenantId !== tenantId) {
        return next(new ForbiddenError('Access denied: Project does not belong to your tenant'));
      }
    }

    // 3. Resolve taskId
    let taskId = (req.query.taskId as string) || (req.body.taskId as string);
    if (req.baseUrl.endsWith('/tasks') && isUuid(req.params.id)) {
      taskId = req.params.id;
    }

    if (taskId && isUuid(taskId)) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { project: { select: { company: { select: { tenantId: true } } } } },
      });
      if (task && task.project.company.tenantId !== tenantId) {
        return next(new ForbiddenError('Access denied: Task does not belong to your tenant'));
      }
    }

    // 4. Resolve employeeId
    let employeeId = (req.query.employeeId as string) || (req.body.employeeId as string);
    if (req.baseUrl.endsWith('/employees') && isUuid(req.params.id)) {
      employeeId = req.params.id;
    }

    if (employeeId && isUuid(employeeId)) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { company: { select: { tenantId: true } } },
      });
      if (employee && employee.company.tenantId !== tenantId) {
        return next(new ForbiddenError('Access denied: Employee does not belong to your tenant'));
      }
    }
  } catch (error) {
    // Fail closed on database/unexpected error
    return next(new ForbiddenError('Access denied: Error validating tenant boundary'));
  }

  next();
};
