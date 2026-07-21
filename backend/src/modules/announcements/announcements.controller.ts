import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { announcementsService } from './announcements.service';
import { ValidationError, BadRequestError, NotFoundError } from '../../shared/errors';

const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  body: z.string().min(5, 'Body must be at least 5 characters'),
});

export class AnnouncementsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const announcements = await announcementsService.list(companyId);
      return res.status(200).json({
        status: 'success',
        data: { announcements },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const announcement = await announcementsService.create(
        req.userId!,
        parsed.data.title,
        parsed.data.body
      );
      return res.status(201).json({
        status: 'success',
        data: { announcement },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await announcementsService.delete(id, req.userId!);
      return res.status(200).json({
        status: 'success',
        message: 'Announcement deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const announcement = await announcementsService.getById(id);
      if (!announcement) {
        return next(new NotFoundError('Announcement not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { announcement },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = createAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }
      const announcement = await announcementsService.update(
        id,
        req.userId!,
        parsed.data.title,
        parsed.data.body
      );
      return res.status(200).json({
        status: 'success',
        data: { announcement },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const announcementsController = new AnnouncementsController();
