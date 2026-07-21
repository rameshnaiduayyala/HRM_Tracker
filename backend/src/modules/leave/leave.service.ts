import { prisma } from '../../shared/database';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors';

export class LeaveService {
  async getEmployeeProfile(userId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundError('Employee profile not found for this user');
    }
    return employee;
  }

  // --- Leave Types ---
  async listTypes(companyId: string) {
    return prisma.leaveType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createType(companyId: string, name: string, allowedDays: number, isPaid: boolean) {
    const existing = await prisma.leaveType.findFirst({
      where: { name, companyId },
    });

    if (existing) {
      throw new ConflictError('A leave type with this name already exists');
    }

    return prisma.leaveType.create({
      data: {
        name,
        companyId,
        allowedDays,
        isPaid,
      },
    });
  }

  async getType(id: string, companyId: string) {
    return prisma.leaveType.findFirst({
      where: { id, companyId },
    });
  }

  async updateType(id: string, companyId: string, name: string, allowedDays: number, isPaid: boolean) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, companyId },
    });
    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }
    return prisma.leaveType.update({
      where: { id },
      data: { name, allowedDays, isPaid },
    });
  }

  async deleteType(id: string, companyId: string) {
    const leaveType = await prisma.leaveType.findFirst({
      where: { id, companyId },
    });
    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }
    return prisma.leaveType.delete({
      where: { id },
    });
  }

  async getRequest(id: string, companyId: string) {
    return prisma.leaveRequest.findFirst({
      where: {
        id,
        employee: { companyId },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        leaveType: true,
      },
    });
  }

  async deleteRequest(id: string, companyId: string) {
    const request = await prisma.leaveRequest.findFirst({
      where: {
        id,
        employee: { companyId },
      },
    });
    if (!request) {
      throw new NotFoundError('Leave request not found');
    }
    return prisma.leaveRequest.delete({
      where: { id },
    });
  }

  // --- Leave Requests ---
  async listRequests(filters: { employeeId?: string; companyId?: string }) {
    const where: any = {};
    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    } else if (filters.companyId) {
      where.employee = { companyId: filters.companyId };
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(userId: string, leaveTypeId: string, startDate: Date, endDate: Date, reason?: string) {
    const employee = await this.getEmployeeProfile(userId);

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });
    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }

    // Calculate days requested
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end.getTime() < start.getTime()) {
      throw new BadRequestError('End date cannot be before start date');
    }

    const durationMs = end.getTime() - start.getTime();
    const daysRequested = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Get current leave balance
    const currentYear = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        year: currentYear,
      },
    });

    // If no balance record exists, initialize it
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          used: 0,
          total: leaveType.allowedDays,
        },
      });
    }

    const remaining = balance.total - balance.used;
    if (remaining < daysRequested) {
      throw new BadRequestError(`Insufficient leave balance. Requested: ${daysRequested}, Remaining: ${remaining}`);
    }

    return prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveTypeId,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING',
      },
      include: {
        leaveType: true,
      },
    });
  }

  async reviewRequest(requestId: string, reviewerUserId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) {
      throw new NotFoundError('Leave request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestError('Leave request has already been reviewed');
    }

    const reviewer = await this.getEmployeeProfile(reviewerUserId);

    const requestCreator = await prisma.employee.findUnique({
      where: { id: request.employeeId },
    });

    const reviewerUser = await prisma.user.findUnique({
      where: { id: reviewerUserId },
      include: { role: true },
    });

    const isReportingManager = requestCreator?.managerId === reviewer.id;
    const isOrgAdmin = reviewerUser?.role?.name === 'ADMIN' || reviewerUser?.role?.name === 'SUPER_ADMIN';

    if (request.employeeId === reviewer.id) {
      throw new BadRequestError('You cannot approve or reject your own leave request.');
    }

    if (!isReportingManager && !isOrgAdmin) {
      throw new BadRequestError('Only the reporting manager or an administrator can approve/reject this leave request.');
    }

    if (status === 'APPROVED') {
      // Calculate days requested
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const durationMs = end.getTime() - start.getTime();
      const daysRequested = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      // Update used balance
      const currentYear = new Date().getFullYear();
      let balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
      });

      if (!balance) {
        // Initialize if not found
        balance = await prisma.leaveBalance.create({
          data: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year: currentYear,
            used: 0,
            total: request.leaveType.allowedDays,
          },
        });
      }

      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: { increment: daysRequested },
        },
      });
    }

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: reviewer.id,
        reviewNote,
      },
      include: {
        leaveType: true,
      },
    });
  }

  // --- Leave Balances ---
  async getMyBalances(userId: string) {
    const employee = await this.getEmployeeProfile(userId);
    const currentYear = new Date().getFullYear();

    // Auto-initialize balances if missing for any type
    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId: employee.companyId },
    });

    for (const lt of leaveTypes) {
      const existing = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
        },
      });

      if (!existing) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
            used: 0,
            total: lt.allowedDays,
          },
        });
      }
    }

    return prisma.leaveBalance.findMany({
      where: {
        employeeId: employee.id,
        year: currentYear,
      },
      include: {
        leaveType: true,
      },
    });
  }

  // --- Holidays ---
  async listHolidays(companyId: string) {
    return prisma.holiday.findMany({
      where: { companyId },
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(companyId: string, name: string, date: Date) {
    return prisma.holiday.create({
      data: {
        name,
        companyId,
        date: new Date(date),
      },
    });
  }

  async deleteHoliday(id: string, companyId: string) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, companyId },
    });

    if (!holiday) {
      throw new NotFoundError('Holiday not found');
    }

    return prisma.holiday.delete({
      where: { id },
    });
  }
}

export const leaveService = new LeaveService();
