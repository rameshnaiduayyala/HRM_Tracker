import { prisma } from '../../shared/database';
import fs from 'fs';
import path from 'path';

import sharp from 'sharp';

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

    const inputBuffer = Buffer.from(imageBase64, 'base64');
    
    // Process image with Sharp node package for exact sidebar fit
    // 1. Trim surrounding blank whitespace
    // 2. Resize proportionally to max 180x44 px inside 200x48 px frame
    const processedBuffer = await sharp(inputBuffer)
      .trim()
      .resize(180, 44, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const relativeFilePath = `tenants/${tenantId}/company/${companyId}/logo.png`;
    const localPath = path.join(__dirname, '../../../uploads', relativeFilePath);

    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, processedBuffer);
    const logoUrl = `/uploads/${relativeFilePath}?v=${Date.now()}`;

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
