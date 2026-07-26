import { prisma } from '../../shared/database';

export class PlansService {
  async listPlans() {
    return prisma.plan.findMany({
      orderBy: { pricePerUser: 'asc' },
    });
  }

  async createPlan(data: { 
    name: string; 
    pricePerUser: number; 
    currency?: string;
    billingCycle?: string; 
    employeeLimit?: number; 
    modules: string[];
    features?: string[] 
  }) {
    return prisma.plan.create({
      data: {
        name: data.name,
        pricePerUser: data.pricePerUser,
        currency: data.currency || 'INR',
        billingCycle: data.billingCycle || 'MONTHLY',
        employeeLimit: data.employeeLimit || 100,
        modules: data.modules,
        features: data.features || [],
      },
    });
  }

  async updatePlan(id: string, data: { 
    name?: string; 
    pricePerUser?: number;
    currency?: string;
    billingCycle?: string; 
    employeeLimit?: number;
    modules?: string[];
    features?: string[] 
  }) {
    if (data.name) {
      const existing = await prisma.plan.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new Error(`A billing plan with the name "${data.name}" already exists.`);
      }
    }

    return prisma.plan.update({
      where: { id },
      data,
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
