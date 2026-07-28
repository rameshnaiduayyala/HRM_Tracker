import { prisma } from '../../shared/database';
import { generatePayslipHTML } from '../../shared/utils/documentTemplates';

export class PayslipsService {
  async listPayslips(companyId: string, employeeId?: string) {
    return prisma.payslip.findMany({
      where: {
        employee: {
          companyId,
          ...(employeeId ? { id: employeeId } : {}),
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
            department: {
              select: {
                name: true,
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
    hra?: number;
    specialAllowance?: number;
    conveyance?: number;
    allowance?: number;
    pfDeduction?: number;
    taxDeduction?: number;
    otherDeductions?: number;
    deductions?: number;
    paymentMethod?: string;
  }) {
    const baseSalary = data.baseSalary;
    const hra = data.hra ?? Math.round(baseSalary * 0.4);
    const specialAllowance = data.specialAllowance ?? Math.round(baseSalary * 0.2);
    const conveyance = data.conveyance ?? 1600;
    const allowance = data.allowance ?? (hra + specialAllowance + conveyance);

    const pfDeduction = data.pfDeduction ?? Math.round(baseSalary * 0.12);
    const taxDeduction = data.taxDeduction ?? Math.round(baseSalary * 0.05);
    const otherDeductions = data.otherDeductions ?? 0;
    const totalDeductions = data.deductions ?? (pfDeduction + taxDeduction + otherDeductions);

    const totalEarnings = baseSalary + hra + specialAllowance + conveyance;
    const netPay = Math.max(0, totalEarnings - totalDeductions);

    return prisma.payslip.create({
      data: {
        employeeId: data.employeeId,
        month: data.month,
        baseSalary,
        hra,
        specialAllowance,
        conveyance,
        allowance,
        pfDeduction,
        taxDeduction,
        otherDeductions,
        deductions: totalDeductions,
        netPay,
        status: 'PAID',
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        paymentDate: new Date(),
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
            department: true,
          },
        },
      },
    });
  }

  async renderPayslipHTML(id: string) {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
            company: true,
          },
        },
      },
    });

    if (!payslip) return null;

    return generatePayslipHTML({
      employeeName: `${payslip.employee.user.firstName} ${payslip.employee.user.lastName}`,
      employeeNum: payslip.employee.employeeNum,
      designation: payslip.employee.designation || 'Team Member',
      department: payslip.employee.department ? payslip.employee.department.name : 'General',
      companyName: payslip.employee.company.name,
      companyLogo: payslip.employee.company.logo || undefined,
      month: payslip.month,
      baseSalary: payslip.baseSalary,
      hra: payslip.hra,
      specialAllowance: payslip.specialAllowance,
      conveyance: payslip.conveyance,
      pfDeduction: payslip.pfDeduction,
      taxDeduction: payslip.taxDeduction,
      otherDeductions: payslip.otherDeductions,
      netPay: payslip.netPay,
      paymentMethod: payslip.paymentMethod || 'Bank Transfer',
      paymentDate: payslip.paymentDate ? payslip.paymentDate.toISOString() : undefined,
    });
  }

  async deletePayslip(id: string) {
    return prisma.payslip.delete({
      where: { id },
    });
  }
}

export const payslipsService = new PayslipsService();
