import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const legacyAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as {
      userId: string;
      tenantId: string;
      role?: string;
    };

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;

    return next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid access token'));
  }
};
