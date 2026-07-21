import { prisma } from '../../shared/database';

export class CompaniesService {
  async getCompanyById(tenantId: string, companyId: string) {
    return prisma.company.findFirst({
      where: { id: companyId, tenantId },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async getCompaniesByTenant(tenantId: string) {
    return prisma.company.findMany({
      where: { tenantId },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });
  }

  async createCompany(tenantId: string, name: string) {
    return prisma.company.create({
      data: {
        name,
        tenantId,
      },
    });
  }

  async updateCompany(companyId: string, tenantId: string, name: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    return prisma.company.update({
      where: { id: companyId },
      data: { name },
    });
  }

  async deleteCompany(companyId: string, tenantId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    return prisma.company.delete({
      where: { id: companyId },
    });
  }
}

export const companiesService = new CompaniesService();
