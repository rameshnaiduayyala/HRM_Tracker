import { prisma } from '../../shared/database';
import { NotFoundError, ConflictError } from '../../shared/errors';

export class DepartmentsService {
  async list(companyId: string) {
    return prisma.department.findMany({
      where: { companyId },
      include: {
        employees: {
          include: {
            user: true,
          },
        },
        teams: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(companyId: string, name: string) {
    const existing = await prisma.department.findFirst({
      where: { name, companyId },
    });

    if (existing) {
      throw new ConflictError('A department with this name already exists in the company');
    }

    return prisma.department.create({
      data: {
        name,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, name: string) {
    const department = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const duplicate = await prisma.department.findFirst({
      where: {
        name,
        companyId,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new ConflictError('A department with this name already exists in the company');
    }

    return prisma.department.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: string, companyId: string) {
    const department = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return prisma.department.delete({
      where: { id },
    });
  }

  async getById(id: string, companyId: string) {
    return prisma.department.findFirst({
      where: { id, companyId },
      include: {
        employees: {
          include: {
            user: true,
          },
        },
        teams: true,
      },
    });
  }
}

export const departmentsService = new DepartmentsService();
