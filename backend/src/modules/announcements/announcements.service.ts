import { prisma } from '../../shared/database';
import { NotFoundError } from '../../shared/errors';

export class AnnouncementsService {
  async getEmployeeProfile(userId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundError('Employee profile not found');
    }
    return employee;
  }

  async list(companyId: string) {
    return prisma.announcement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, title: string, body: string) {
    const employee = await this.getEmployeeProfile(userId);

    return prisma.announcement.create({
      data: {
        title,
        body,
        companyId: employee.companyId,
        authorId: employee.id,
      },
    });
  }

  async delete(id: string, userId: string) {
    const employee = await this.getEmployeeProfile(userId);

    const announcement = await prisma.announcement.findFirst({
      where: { id, companyId: employee.companyId },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return prisma.announcement.delete({
      where: { id },
    });
  }

  async getById(id: string) {
    return prisma.announcement.findUnique({
      where: { id },
    });
  }

  async update(id: string, userId: string, title: string, body: string) {
    const employee = await this.getEmployeeProfile(userId);

    const announcement = await prisma.announcement.findFirst({
      where: { id, companyId: employee.companyId },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        title,
        body,
      },
    });
  }
}

export const announcementsService = new AnnouncementsService();
