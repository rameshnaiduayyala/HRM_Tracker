import { prisma } from '../../shared/database';
import { NotFoundError, BadRequestError } from '../../shared/errors';

export class TimesheetsService {
  async submitTimesheet(employeeId: string, startDate: Date, endDate: Date) {
    // Check if a timesheet for this range already exists for the employee
    const existing = await prisma.timesheet.findFirst({
      where: {
        employeeId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (existing) {
      throw new BadRequestError('A timesheet already exists covering part of this date range.');
    }

    // Get all time logs in the date range that are not already linked to a timesheet
    const timeLogs = await prisma.taskTimeLog.findMany({
      where: {
        employeeId,
        loggedAt: {
          gte: startDate,
          lte: endDate,
        },
        timesheetId: null,
      },
    });

    if (timeLogs.length === 0) {
      throw new BadRequestError('No unsubmitted time logs found for the selected date range.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create Timesheet
      const timesheet = await tx.timesheet.create({
        data: {
          employeeId,
          startDate,
          endDate,
          status: 'PENDING',
        },
      });

      // 2. Link Time logs to Timesheet
      await tx.taskTimeLog.updateMany({
        where: {
          id: { in: timeLogs.map((log) => log.id) },
        },
        data: {
          timesheetId: timesheet.id,
        },
      });

      return timesheet;
    });
  }

  async listTimesheets(companyId: string, filters?: { employeeId?: string; status?: string }) {
    return prisma.timesheet.findMany({
      where: {
        employee: { companyId },
        ...(filters?.employeeId && { employeeId: filters.employeeId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        timeLogs: {
          include: {
            task: {
              select: {
                title: true,
                project: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getTimesheetById(id: string, companyId: string) {
    const timesheet = await prisma.timesheet.findFirst({
      where: { id, employee: { companyId } },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        timeLogs: {
          include: {
            task: {
              select: {
                title: true,
                project: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timesheet) {
      throw new NotFoundError('Timesheet not found');
    }

    return timesheet;
  }

  async reviewTimesheet(
    id: string,
    companyId: string,
    approverId: string,
    status: 'APPROVED' | 'REJECTED',
    comments?: string
  ) {
    const timesheet = await prisma.timesheet.findFirst({
      where: { id, employee: { companyId } },
    });

    if (!timesheet) {
      throw new NotFoundError('Timesheet not found');
    }

    if (timesheet.status !== 'PENDING') {
      throw new BadRequestError('Timesheet has already been reviewed');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id },
        data: {
          status,
          approvedAt: new Date(),
          approvedBy: approverId,
          comments,
        },
      });

      // If rejected, unlink time logs so employee can adjust and re-submit
      if (status === 'REJECTED') {
        await tx.taskTimeLog.updateMany({
          where: { timesheetId: id },
          data: { timesheetId: null },
        });
      }

      return updated;
    });
  }
}

export const timesheetsService = new TimesheetsService();
