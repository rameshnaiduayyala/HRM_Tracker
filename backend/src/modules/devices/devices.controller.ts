import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { devicesService } from './devices.service';
import { ValidationError, UnauthorizedError } from '../../shared/errors';

const registerDeviceSchema = z.object({
  fingerprint: z.string().min(4, 'Fingerprint must be at least 4 characters'),
  name: z.string().optional(),
});

export class DevicesController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const parsed = registerDeviceSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const device = await devicesService.registerDevice(req.userId, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { device },
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const devices = await devicesService.getDevicesByUser(req.userId);
      return res.status(200).json({
        status: 'success',
        data: { devices },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const devicesController = new DevicesController();
