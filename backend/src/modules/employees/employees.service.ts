import bcrypt from 'bcrypt';
import { prisma } from '../../shared/database';

export class EmployeesService {
  async getEmployeesByCompany(companyId: string) {
    return prisma.employee.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        department: true,
        team: true,
        manager: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attendances: {
          orderBy: { clockIn: 'desc' },
          take: 50,
        },
        workSessions: {
          orderBy: { start: 'desc' },
          take: 50,
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            screenshots: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
      },
    });
  }

  async getEmployeeById(id: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        department: true,
        team: true,
        manager: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        subordinates: true,
      },
    });
  }

  async createEmployee(
    tenantId: string,
    data: {
      employeeNum: string;
      companyId: string;
      departmentId?: string;
      teamId?: string;
      managerId?: string;
      designation?: string;
      // Optional user parameters to create a user account in parallel
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      roleName?: string; // MANAGER, EMPLOYEE
      userId?: string; // fallback if already exists
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // Enforce subscription plan employee limit check
      const activeSubscription = await tx.subscription.findFirst({
        where: {
          companyId: data.companyId,
          status: 'ACTIVE',
        },
        include: { plan: true },
      });

      if (activeSubscription) {
        const currentCount = await tx.employee.count({
          where: { companyId: data.companyId },
        });

        if (currentCount >= activeSubscription.plan.employeeLimit) {
          throw new Error(
            `Employee limit reached. Your active subscription plan "${activeSubscription.plan.name}" limits your workspace to a maximum of ${activeSubscription.plan.employeeLimit} employee profiles. Please upgrade your plan.`
          );
        }
      }

      let finalUserId = data.userId;

      if (data.email && data.password && data.firstName && data.lastName) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        
        // Find or fallback default role for the tenant
        const targetRoleName = data.roleName || 'EMPLOYEE';
        let role = await tx.role.findFirst({
          where: { name: targetRoleName, tenantId },
        });

        if (!role) {
          role = await tx.role.create({
            data: { name: targetRoleName, tenantId },
          });
        }

        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            tenantId,
            roleId: role.id,
          },
        });
        
        finalUserId = user.id;
      }

      if (!finalUserId) {
        throw new Error('Either userId or complete user details (email, password, names) must be provided.');
      }

      return tx.employee.create({
        data: {
          employeeNum: data.employeeNum,
          userId: finalUserId,
          companyId: data.companyId,
          departmentId: data.departmentId || null,
          teamId: data.teamId || null,
          managerId: data.managerId || null,
          designation: data.designation || null,
          status: 'ACTIVE',
        },
      });
    });
  }

  async updateEmployee(
    id: string,
    companyId: string,
    data: {
      employeeNum?: string;
      departmentId?: string | null;
      teamId?: string | null;
      managerId?: string | null;
      designation?: string | null;
      status?: string;
      // Optional user details to update
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id, companyId },
      });
      if (!employee) throw new Error('Employee profile not found.');

      const empUpdate: any = {};
      if (data.employeeNum) empUpdate.employeeNum = data.employeeNum;
      if (data.departmentId !== undefined) empUpdate.departmentId = data.departmentId || null;
      if (data.teamId !== undefined) empUpdate.teamId = data.teamId || null;
      if (data.managerId !== undefined) empUpdate.managerId = data.managerId || null;
      if (data.designation !== undefined) empUpdate.designation = data.designation || null;
      if (data.status) empUpdate.status = data.status;

      await tx.employee.update({
        where: { id },
        data: empUpdate,
      });

      const userUpdate: any = {};
      if (data.firstName) userUpdate.firstName = data.firstName;
      if (data.lastName) userUpdate.lastName = data.lastName;
      if (data.email) userUpdate.email = data.email;
      if (data.password) {
        userUpdate.passwordHash = await bcrypt.hash(data.password, 10);
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: employee.userId },
          data: userUpdate,
        });
      }

      return tx.employee.findUnique({
        where: { id },
        include: {
          user: true,
          manager: true,
        },
      });
    });
  }

  async resetEmployeeData(employeeId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete task time logs
      await tx.taskTimeLog.deleteMany({
        where: { employeeId },
      });

      // 2. Delete work sessions (cascades activities and screenshots)
      await tx.workSession.deleteMany({
        where: { employeeId },
      });

      // 3. Delete attendances (cascades breaks)
      await tx.attendance.deleteMany({
        where: { employeeId },
      });
    });
  }

  async deleteEmployee(id: string, companyId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
    });
    if (!employee) {
      throw new Error('Employee profile not found.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete employee profile
      await tx.employee.delete({
        where: { id },
      });

      // 2. Delete linked user account
      await tx.user.delete({
        where: { id: employee.userId },
      });
    });
  }
}

export const employeesService = new EmployeesService();
