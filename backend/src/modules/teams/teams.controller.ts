import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamsService } from './teams.service';
import { ValidationError, BadRequestError, NotFoundError } from '../../shared/errors';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  departmentId: z.string().uuid('Invalid department ID'),
});

const updateTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  departmentId: z.string().uuid('Invalid department ID'),
});

export class TeamsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, companyId } = req.query as Record<string, string>;

      let teams;
      if (companyId) {
        teams = await teamsService.listByCompany(companyId);
      } else if (departmentId) {
        teams = await teamsService.list(departmentId);
      } else {
        return next(new BadRequestError('Either companyId or departmentId query parameter is required'));
      }

      return res.status(200).json({
        status: 'success',
        data: { teams },
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTeamSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const team = await teamsService.create(
        parsed.data.departmentId,
        parsed.data.name
      );
      return res.status(201).json({
        status: 'success',
        data: { team },
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateTeamSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const team = await teamsService.update(
        id,
        parsed.data.departmentId,
        parsed.data.name
      );
      return res.status(200).json({
        status: 'success',
        data: { team },
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const departmentId = req.query.departmentId as string;
      if (!departmentId) {
        return next(new BadRequestError('departmentId query parameter is required'));
      }
      const team = await teamsService.getById(id, departmentId);
      if (!team) {
        return next(new NotFoundError('Team not found'));
      }
      return res.status(200).json({
        status: 'success',
        data: { team },
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const departmentId = req.query.departmentId as string;
      if (!departmentId) {
        return next(new BadRequestError('departmentId query parameter is required'));
      }

      await teamsService.delete(id, departmentId);
      return res.status(200).json({
        status: 'success',
        message: 'Team deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const teamsController = new TeamsController();
