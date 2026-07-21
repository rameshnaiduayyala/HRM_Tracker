import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { workSessionsService } from './workSessions.service';
import { ValidationError } from '../../shared/errors';

const heartbeatSchema = z.object({
  app: z.string().min(1, 'Application name is required'),
  windowTitle: z.string().optional(),
  idleDuration: z.number().nonnegative(),
  activeDuration: z.number().nonnegative(),
});

export class WorkSessionsController {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await workSessionsService.startSession(req.userId!);
      return res.status(201).json({
        status: 'success',
        data: { session },
      });
    } catch (error) {
      return next(error);
    }
  }

  async stop(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, stopReason } = req.body;
      const session = await workSessionsService.stopSession(req.userId!, reason || stopReason);
      return res.status(200).json({
        status: 'success',
        data: { session },
      });
    } catch (error) {
      return next(error);
    }
  }

  async heartbeat(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = heartbeatSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const activity = await workSessionsService.logHeartbeat(req.userId!, parsed.data);
      return res.status(201).json({
        status: 'success',
        data: { activity },
      });
    } catch (error) {
      return next(error);
    }
  }

  async screenshot(req: Request, res: Response, next: NextFunction) {
    try {
      const { image } = req.body;
      if (!image) {
        return next(new ValidationError({ image: { _errors: ['Base64 image data is required'] } }));
      }

      const screenshot = await workSessionsService.uploadScreenshot(req.userId!, image);
      return res.status(201).json({
        status: 'success',
        data: { screenshot },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const workSessionsController = new WorkSessionsController();
