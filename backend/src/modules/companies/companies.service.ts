import { prisma } from '../../shared/database';
import fs from 'fs';
import path from 'path';

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

  async updateCompany(companyId: string, tenantId: string, data: { name?: string; logo?: string }) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    return prisma.company.update({
      where: { id: companyId },
      data,
    });
  }

  async uploadCompanyLogo(companyId: string, tenantId: string, imageBase64: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const relativeFilePath = `tenants/${tenantId}/company/${companyId}/logo.png`;
    const localPath = path.join(__dirname, '../../../uploads', relativeFilePath);

    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, buffer);
    const logoUrl = `/uploads/${relativeFilePath}`;

    return prisma.company.update({
      where: { id: companyId },
      data: { logo: logoUrl },
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
