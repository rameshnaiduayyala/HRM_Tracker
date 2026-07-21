import { prisma } from '../../shared/database';
import { NotFoundError, ConflictError } from '../../shared/errors';

export class TeamsService {
  async list(departmentId: string) {
    return prisma.team.findMany({
      where: { departmentId },
      include: {
        employees: { include: { user: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async listByCompany(companyId: string) {
    return prisma.team.findMany({
      where: { department: { companyId } },
      include: {
        department: { select: { id: true, name: true } },
        employees: { include: { user: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(departmentId: string, name: string) {
    const existing = await prisma.team.findFirst({
      where: { name, departmentId },
    });

    if (existing) {
      throw new ConflictError('A team with this name already exists in this department');
    }

    return prisma.team.create({
      data: {
        name,
        departmentId,
      },
    });
  }

  async update(id: string, departmentId: string, name: string) {
    const team = await prisma.team.findFirst({
      where: { id, departmentId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const duplicate = await prisma.team.findFirst({
      where: {
        name,
        departmentId,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new ConflictError('A team with this name already exists in this department');
    }

    return prisma.team.update({
      where: { id },
      data: { name },
    });
  }

  async delete(id: string, departmentId: string) {
    const team = await prisma.team.findFirst({
      where: { id, departmentId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return prisma.team.delete({
      where: { id },
    });
  }

  async getById(id: string, departmentId: string) {
    return prisma.team.findFirst({
      where: { id, departmentId },
      include: {
        employees: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

export const teamsService = new TeamsService();
