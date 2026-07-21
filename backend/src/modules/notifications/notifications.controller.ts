import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationsService.list(req.userId!);
      return res.status(200).json({
        status: 'success',
        data: { notifications },
      });
    } catch (error) {
      return next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await notificationsService.markAsRead(id, req.userId!);
      return res.status(200).json({
        status: 'success',
        data: { notification },
      });
    } catch (error) {
      return next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAllAsRead(req.userId!);
      return res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
