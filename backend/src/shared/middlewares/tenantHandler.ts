import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { BadRequestError, NotFoundError } from '../errors';

export const tenantHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Paths that do not require tenant resolution
  const bypassPaths = ['/health', '/api/v1/tenants', '/api-docs', '/favicon.ico', '/'];
  const isBypassed = bypassPaths.some((path) => req.path.startsWith(path));

  if (isBypassed) {
    return next();
  }

  // Extract from header x-tenant-id or host subdomain
  let tenantId = req.headers['x-tenant-id'] as string;
  const host = req.headers.host || '';

  // If no header, extract subdomain (e.g. tenant1.example.com)
  if (!tenantId && host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    const parts = host.split('.');
    if (parts.length > 2) {
      tenantId = parts[0];
    }
  }

  if (!tenantId) {
    return next(
      new BadRequestError('Tenant identifier (X-Tenant-ID header or subdomain) is required')
    );
  }

  // Look up tenant by ID or subdomain
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantId }, { subdomain: tenantId }],
    },
  });

  if (!tenant) {
    return next(new NotFoundError('Tenant not found'));
  }

  if (tenant.status !== 'ACTIVE') {
    return next(new BadRequestError('Tenant account is not active'));
  }

  // Attach tenant to the request context
  req.tenantId = tenant.id;
  req.tenant = tenant;

  next();
};
