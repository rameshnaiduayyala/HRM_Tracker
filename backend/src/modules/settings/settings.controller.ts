import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { settingsService } from './settings.service';
import { ValidationError, BadRequestError } from '../../shared/errors';

const updateSettingsSchema = z.object({
  workingHoursPerDay: z.number().int().min(1).max(24).optional(),
  screenshotInterval: z.number().int().min(10).optional(),
  idleThreshold: z.number().int().min(30).optional(),
  timezone: z.string().min(1).optional(),
  shiftStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid shift start format (HH:MM)').optional(),
  shiftEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid shift end format (HH:MM)').optional(),
});

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const settings = await settingsService.getSettings(companyId);
      return res.status(200).json({
        status: 'success',
        data: { settings },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const settings = await settingsService.updateSettings(companyId, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { settings },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const settingsController = new SettingsController();
