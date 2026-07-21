import { prisma } from '../../shared/database';

export class PayslipsService {
  async listPayslips(companyId: string) {
    return prisma.payslip.findMany({
      where: {
        employee: {
          companyId,
        },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayslip(data: {
    employeeId: string;
    month: string;
    baseSalary: number;
    allowance: number;
    deductions: number;
  }) {
    const netPay = data.baseSalary + data.allowance - data.deductions;

    return prisma.payslip.create({
      data: {
        employeeId: data.employeeId,
        month: data.month,
        baseSalary: data.baseSalary,
        allowance: data.allowance,
        deductions: data.deductions,
        netPay,
        status: 'PAID',
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
      },
    });
  }

  async deletePayslip(id: string) {
    return prisma.payslip.delete({
      where: { id },
    });
  }
}

export const payslipsService = new PayslipsService();
