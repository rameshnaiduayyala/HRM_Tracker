import { prisma } from '../../shared/database';

export class PlansService {
  async listPlans() {
    return prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async createPlan(data: { 
    name: string; 
    price: number; 
    billingCycle?: string; 
    employeeLimit?: number; 
    features?: string[] 
  }) {
    return prisma.plan.create({
      data: {
        name: data.name.toUpperCase(),
        price: data.price,
        billingCycle: data.billingCycle || 'MONTHLY',
        employeeLimit: data.employeeLimit || 5,
        features: data.features || [],
      },
    });
  }

  async updatePlan(id: string, data: { 
    name?: string; 
    price?: number; 
    billingCycle?: string; 
    employeeLimit?: number; 
    features?: string[] 
  }) {
    if (data.name) {
      const normalizedName = data.name.toUpperCase();
      const existing = await prisma.plan.findFirst({
        where: {
          name: normalizedName,
          id: { not: id },
        },
      });
      if (existing) {
        throw new Error(`A billing plan with the name "${normalizedName}" already exists.`);
      }
    }

    return prisma.plan.update({
      where: { id },
      data: {
        ...data,
        ...(data.name && { name: data.name.toUpperCase() }),
      },
    });
  }

  async deletePlan(id: string) {
    const activeSubCount = await prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (activeSubCount > 0) {
      throw new Error('Cannot delete plan because active workspaces are currently subscribed to it.');
    }

    // Delete inactive subscriptions to prevent foreign key constraint violations
    await prisma.subscription.deleteMany({
      where: { planId: id },
    });

    return prisma.plan.delete({
      where: { id },
    });
  }
}
export const plansService = new PlansService();
