import { prisma } from '../../shared/database';
import { NotFoundError } from '../../shared/errors';
import { notifyTaskUpdated } from '../../infrastructure/socket';
import { notificationsService } from '../notifications/notifications.service';

export class TasksService {
  // --- Projects ---
  async getProjectsByCompany(companyId: string) {
    return prisma.project.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { tasks: true },
        },
        members: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        milestones: true,
      },
    });
  }

  async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        members: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
        milestones: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }

  async createProject(companyId: string, name: string) {
    return prisma.project.create({
      data: {
        name,
        companyId,
      },
    });
  }

  async updateProject(id: string, name: string, status: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return prisma.project.update({
      where: { id },
      data: { name, status },
    });
  }

  async deleteProject(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return prisma.project.delete({
      where: { id },
    });
  }

  // --- Project Members ---
  async addProjectMember(projectId: string, employeeId: string, role = 'MEMBER') {
    return prisma.projectMember.create({
      data: {
        projectId,
        employeeId,
        role,
      },
    });
  }

  async removeProjectMember(projectId: string, employeeId: string) {
    return prisma.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId,
        },
      },
    });
  }

  // --- Project Milestones ---
  async createMilestone(projectId: string, title: string, dueDate: Date) {
    return prisma.projectMilestone.create({
      data: {
        projectId,
        title,
        dueDate,
      },
    });
  }

  async toggleMilestone(milestoneId: string, isCompleted: boolean) {
    return prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { isCompleted },
    });
  }

  // --- Tasks ---
  async getTasksByProject(projectId: string) {
    return prisma.task.findMany({
      where: { projectId },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTasksByCompany(
    companyId: string,
    filters?: { employeeId?: string; projectId?: string; priority?: string }
  ) {
    return prisma.task.findMany({
      where: {
        project: { companyId },
        ...(filters?.employeeId && { employeeId: filters.employeeId }),
        ...(filters?.projectId && { projectId: filters.projectId }),
        ...(filters?.priority && { priority: filters.priority }),
      },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        project: true,
        comments: {
          orderBy: { createdAt: 'asc' }
        },
        timeLogs: {
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { loggedAt: 'desc' }
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const authorIds = task.comments.map(c => c.authorId);
    const users = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, firstName: true, lastName: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const commentsWithAuthors = task.comments.map(c => ({
      ...c,
      author: userMap.get(c.authorId) || { firstName: 'Team', lastName: 'Member' }
    }));

    return {
      ...task,
      comments: commentsWithAuthors
    };
  }

  async createTask(data: {
    title: string;
    description?: string;
    projectId: string;
    employeeId?: string | null;
    priority?: string;
    status?: string;
  }) {
    const newTask = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        projectId: data.projectId,
        employeeId: data.employeeId || null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'TODO',
      },
      include: {
        project: true,
      },
    });

    // Notify assignee on creation
    if (newTask.employeeId) {
      const assignedEmployee = await prisma.employee.findUnique({
        where: { id: newTask.employeeId },
        include: { user: true }
      });
      if (assignedEmployee?.userId) {
        await notificationsService.create(
          assignedEmployee.userId,
          'New Task Assigned',
          `You have been assigned to task: "${newTask.title}"`,
          'TASK',
          `/dashboard/tasks`
        );
      }
    }

    if (newTask.project?.companyId) {
      notifyTaskUpdated(newTask.project.companyId, newTask.id, 'create');
    }

    return newTask;
  }

  async updateTask(id: string, data: {
    title?: string;
    description?: string;
    employeeId?: string | null;
    priority?: string;
    status?: string;
  }) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        employeeId: data.employeeId,
        priority: data.priority,
        status: data.status,
      },
      include: {
        project: true,
      },
    });

    // Notify new assignee if the assignee has changed
    if (data.employeeId && data.employeeId !== task.employeeId) {
      const assignedEmployee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        include: { user: true }
      });
      if (assignedEmployee?.userId) {
        await notificationsService.create(
          assignedEmployee.userId,
          'New Task Assigned',
          `You have been assigned to task: "${updatedTask.title}"`,
          'TASK',
          `/dashboard/tasks`
        );
      }
    }

    if (updatedTask.project?.companyId) {
      notifyTaskUpdated(updatedTask.project.companyId, updatedTask.id, 'update');
    }

    return updatedTask;
  }

  async deleteTask(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const deletedTask = await prisma.task.delete({
      where: { id },
    });

    if (task.project?.companyId) {
      notifyTaskUpdated(task.project.companyId, id, 'delete');
    }

    return deletedTask;
  }

  // --- Task Comments ---
  async addTaskComment(taskId: string, authorId: string, body: string) {
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        body,
      },
      include: {
        task: {
          include: { project: true }
        }
      }
    });

    if (comment.task?.project?.companyId) {
      notifyTaskUpdated(comment.task.project.companyId, taskId, 'comment');
    }

    return comment;
  }

  // --- Task Time Logs ---
  async addTaskTimeLog(taskId: string, userId: string, minutes: number, note?: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }

    const log = await prisma.taskTimeLog.create({
      data: {
        taskId,
        employeeId: employee.id,
        minutes,
        note,
      },
      include: {
        task: {
          include: { project: true }
        }
      }
    });

    if (log.task?.project?.companyId) {
      notifyTaskUpdated(log.task.project.companyId, taskId, 'timeLog');
    }

    return log;
  }
}

export const tasksService = new TasksService();
