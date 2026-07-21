import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { ValidationError } from '../../shared/errors';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceFingerprint: z.string().optional(),
});

const legacyLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  deviceFingerprint: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      // tenantId is assured by the tenantHandler middleware
      const user = await authService.register(req.tenantId!, {
        email: parsed.data.email,
        passwordHash: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      });

      return res.status(201).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const result = await authService.login({
        email: parsed.data.email,
        passwordHash: parsed.data.password,
        deviceFingerprint: parsed.data.deviceFingerprint,
      });

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const result = await authService.refresh(parsed.data.refreshToken);

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async legacyLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = legacyLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const result = await authService.loginLegacy({
        email: parsed.data.email,
        passwordHash: parsed.data.password,
        deviceFingerprint: parsed.data.deviceFingerprint,
      });

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      await authService.logout(parsed.data.refreshToken);

      return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
