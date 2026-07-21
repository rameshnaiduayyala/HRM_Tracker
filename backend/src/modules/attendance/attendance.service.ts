import { prisma } from '../../shared/database';
import { BadRequestError, NotFoundError } from '../../shared/errors';

export class AttendanceService {
  async getEmployeeProfile(userId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundError('Employee profile not found for this user');
    }
    return employee;
  }

  async getStatus(userId: string) {
    const employee = await this.getEmployeeProfile(userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        clockIn: { gte: todayStart },
      },
      orderBy: { clockIn: 'desc' },
      include: { breaks: true },
    });

    return {
      clockedIn: !!attendance && !attendance.clockOut,
      attendance,
      employee,
    };
  }

  async clockIn(userId: string) {
    const employee = await this.getEmployeeProfile(userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if they already clocked in today (restricted to once per day)
    const todayRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        clockIn: { gte: todayStart },
      },
    });

    if (todayRecord) {
      throw new BadRequestError('Shift attendance clock-in is restricted to once per day');
    }

    return prisma.attendance.create({
      data: {
        employeeId: employee.id,
        clockIn: new Date(),
      },
    });
  }

  async clockOut(userId: string) {
    const employee = await this.getEmployeeProfile(userId);

    const active = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!active) {
      throw new BadRequestError('You are not clocked in');
    }

    return prisma.attendance.update({
      where: { id: active.id },
      data: {
        clockOut: new Date(),
      },
    });
  }
}

export const attendanceService = new AttendanceService();
