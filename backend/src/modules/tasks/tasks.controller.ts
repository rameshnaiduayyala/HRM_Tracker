import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { tasksService } from './tasks.service';
import { ValidationError, BadRequestError } from '../../shared/errors';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  companyId: z.string().uuid('Invalid company ID'),
});

const updateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']),
});

const addProjectMemberSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  role: z.enum(['LEAD', 'MEMBER']).optional(),
});

const createMilestoneSchema = z.object({
  title: z.string().min(2, 'Milestone title is required'),
  dueDate: z.string().datetime({ message: 'Invalid due date format' }),
});

const toggleMilestoneSchema = z.object({
  isCompleted: z.boolean(),
});

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid('Invalid project ID'),
  employeeId: z.string().uuid().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  employeeId: z.string().uuid().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
});

const addTaskCommentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty'),
});

const addTaskTimeLogSchema = z.object({
  minutes: z.number().int().min(1, 'Minutes logged must be at least 1'),
  note: z.string().optional(),
});

export class TasksController {
  // --- Projects ---
  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        return next(new BadRequestError('companyId query parameter is required'));
      }

      const projects = await tasksService.getProjectsByCompany(companyId);
      return res.status(200).json({
        status: 'success',
        data: { projects },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await tasksService.getProjectById(id);
      return res.status(200).json({
        status: 'success',
        data: { project },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const project = await tasksService.createProject(parsed.data.companyId, parsed.data.name);
      return res.status(201).json({
        status: 'success',
        data: { project },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const project = await tasksService.updateProject(id, parsed.data.name, parsed.data.status);
      return res.status(200).json({
        status: 'success',
        data: { project },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await tasksService.deleteProject(id);
      return res.status(200).json({
        status: 'success',
        message: 'Project deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Project Members ---
  async addProjectMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = addProjectMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const member = await tasksService.addProjectMember(id, parsed.data.employeeId, parsed.data.role);
      return res.status(201).json({
        status: 'success',
        data: { member },
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeProjectMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, employeeId } = req.params;
      await tasksService.removeProjectMember(id, employeeId);
      return res.status(200).json({
        status: 'success',
        message: 'Member removed from project successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Milestones ---
  async createMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = createMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const milestone = await tasksService.createMilestone(id, parsed.data.title, new Date(parsed.data.dueDate));
      return res.status(201).json({
        status: 'success',
        data: { milestone },
      });
    } catch (error) {
      return next(error);
    }
  }

  async toggleMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      const { milestoneId } = req.params;
      const parsed = toggleMilestoneSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const milestone = await tasksService.toggleMilestone(milestoneId, parsed.data.isCompleted);
      return res.status(200).json({
        status: 'success',
        data: { milestone },
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Tasks ---
  async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, companyId, employeeId, priority } = req.query as Record<string, string>;

      let tasks;
      if (projectId && !companyId) {
        tasks = await tasksService.getTasksByProject(projectId);
      } else if (companyId) {
        tasks = await tasksService.getTasksByCompany(companyId, { employeeId, projectId, priority });
      } else {
        return next(new BadRequestError('Either projectId or companyId query parameter is required'));
      }

      return res.status(200).json({
        status: 'success',
        data: { tasks },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const task = await tasksService.getTaskById(id);
      return res.status(200).json({
        status: 'success',
        data: { task },
      });
    } catch (error) {
      return next(error);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const task = await tasksService.createTask(parsed.data);
      return res.status(201).json({
        status: 'success',
        data: { task },
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const task = await tasksService.updateTask(id, parsed.data);
      return res.status(200).json({
        status: 'success',
        data: { task },
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await tasksService.deleteTask(id);
      return res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Comments ---
  async addTaskComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = addTaskCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const comment = await tasksService.addTaskComment(id, req.userId!, parsed.data.body);
      return res.status(201).json({
        status: 'success',
        data: { comment },
      });
    } catch (error) {
      return next(error);
    }
  }

  // --- Time Logs ---
  async addTaskTimeLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = addTaskTimeLogSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(new ValidationError(parsed.error.format()));
      }

      const log = await tasksService.addTaskTimeLog(id, req.userId!, parsed.data.minutes, parsed.data.note);
      return res.status(201).json({
        status: 'success',
        data: { log },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const tasksController = new TasksController();
