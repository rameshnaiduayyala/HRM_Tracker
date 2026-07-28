import bcrypt from 'bcrypt';
import { prisma } from '../../shared/database';
import { ConflictError } from '../../shared/errors';

export class TenantsService {
  async createTenant(data: {
    name: string;
    subdomain: string;
    adminEmail: string;
    adminPassword?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminPhone?: string;
    companyAddress?: string;
    companySize?: string;
    industry?: string;
    planId?: string;
    selectedModules?: string[];
    userCount?: number;
    status?: string;
  }) {
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: data.subdomain },
    });
    if (existingTenant) {
      throw new ConflictError(`Subdomain '${data.subdomain}' is already taken`);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });
    if (existingUser) {
      throw new ConflictError(`Email '${data.adminEmail}' is already registered`);
    }

    const passwordHash = await bcrypt.hash(data.adminPassword || 'admin123', 10);

    return prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          status: data.status || 'PENDING',
        },
      });

      // 2. Create Company
      const company = await tx.company.create({
        data: {
          name: `${data.name} Division`,
          tenantId: tenant.id,
        },
      });

      // 3. Create Default Roles
      const adminRole = await tx.role.create({
        data: { name: 'COMPANY_ADMIN', description: 'Company Administrator with full company access', tenantId: tenant.id },
      });
      await tx.role.create({
        data: { name: 'HR', description: 'HR Manager for employees and leaves', tenantId: tenant.id },
      });
      await tx.role.create({
        data: { name: 'MANAGER', description: 'Team and Project Manager', tenantId: tenant.id },
      });
      await tx.role.create({
        data: { name: 'EMPLOYEE', description: 'Standard employee account', tenantId: tenant.id },
      });

      // 4. Create Admin User
      const user = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash,
          firstName: data.adminFirstName || 'Admin',
          lastName: data.adminLastName || 'User',
          tenantId: tenant.id,
          roleId: adminRole.id,
        },
      });

      // 5. Create Employee record linking Admin User to Company
      await tx.employee.create({
        data: {
          employeeNum: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: user.id,
          companyId: company.id,
          designation: 'Company Administrator',
          status: 'ACTIVE',
        },
      });

      // 6. Create Subscription for Company based on Plan & Modules
      let targetPlan = null;
      if (data.planId) {
        targetPlan = await tx.plan.findUnique({ where: { id: data.planId } });
      }

      if (!targetPlan && data.selectedModules && data.selectedModules.length > 0) {
        // Find or create dynamically matching plan for selected modules
        targetPlan = await tx.plan.findFirst({
          where: {
            modules: { hasEvery: data.selectedModules },
          },
        });
      }

      if (!targetPlan) {
        // Fallback default starter plan
        targetPlan = await tx.plan.findFirst({
          orderBy: { pricePerUser: 'asc' },
        });
      }

      if (targetPlan) {
        const seats = data.userCount || 5;
        const totalPrice = Number(targetPlan.pricePerUser) * seats;
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: targetPlan.id,
            userCount: seats,
            totalPrice,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
          },
        });
      }

      return { tenant, company, user };
    });
  }

  async activateSubscription(companyId: string, planId: string, userCount: number = 5) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Selected plan not found');

    const totalPrice = Number(plan.pricePerUser) * userCount;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const existing = await prisma.subscription.findFirst({
      where: { companyId },
    });

    if (existing) {
      return prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId,
          userCount,
          totalPrice,
          status: 'ACTIVE',
          endDate,
        },
      });
    } else {
      return prisma.subscription.create({
        data: {
          companyId,
          planId,
          userCount,
          totalPrice,
          status: 'ACTIVE',
          endDate,
        },
      });
    }
  }

  async listTenants() {
    return prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            role: true,
          },
        },
        companies: {
          include: {
            _count: {
              select: { employees: true },
            },
            employees: {
              include: {
                user: true,
              },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });
  }

  async updateTenantStatus(id: string, status: string) {
    return prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async updateTenant(
    id: string,
    data: {
      name?: string;
      adminEmail?: string;
      adminPassword?: string;
      adminFirstName?: string;
      adminLastName?: string;
      planId?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.name) {
        await tx.tenant.update({
          where: { id },
          data: { name: data.name },
        });
      }

      const adminUser = await tx.user.findFirst({
        where: { tenantId: id, role: { name: 'ADMIN' } },
      });

      if (adminUser) {
        const userUpdateData: any = {};
        if (data.adminEmail) userUpdateData.email = data.adminEmail;
        if (data.adminFirstName) userUpdateData.firstName = data.adminFirstName;
        if (data.adminLastName) userUpdateData.lastName = data.adminLastName;
        if (data.adminPassword) {
          userUpdateData.passwordHash = await bcrypt.hash(data.adminPassword, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: adminUser.id },
            data: userUpdateData,
          });
        }
      }

      if (data.planId) {
        const company = await tx.company.findFirst({ where: { tenantId: id } });
        if (company) {
          const activeSub = await tx.subscription.findFirst({
            where: { companyId: company.id, status: 'ACTIVE' },
          });

          if (activeSub) {
            await tx.subscription.update({
              where: { id: activeSub.id },
              data: { planId: data.planId },
            });
          } else {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            await tx.subscription.create({
              data: {
                companyId: company.id,
                planId: data.planId,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate,
              },
            });
          }
        }
      }

      return tx.tenant.findUnique({
        where: { id },
      });
    });
  }

  async getTenantById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
    });
  }

  async getPlatformMetrics() {
    const totalCompanies = await prisma.company.count();
    const totalEmployees = await prisma.employee.count();
    const totalTenants = await prisma.tenant.count();
    
    // Calculate total monthly recurring revenue (MRR) based on active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + Number(sub.totalPrice || Number(sub.plan.pricePerUser) * sub.userCount);
    }, 0);

    const activeSessions = await prisma.workSession.count({
      where: { status: 'RUNNING' },
    });

    return {
      totalCompanies,
      totalEmployees,
      totalTenants,
      totalRevenue,
      activeSessions,
    };
  }

  async getAuditLogs() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to recent 200 logs
    });
  }

  async getTenantBranding(tenantId?: string, subdomain?: string) {
    if (!tenantId && !subdomain) {
      return null;
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          ...(tenantId ? [{ id: tenantId }] : []),
          ...(subdomain ? [{ subdomain }] : []),
        ],
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!tenant) return null;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      subdomain: tenant.subdomain,
      logo: tenant.logo || `/uploads/tenants/${tenant.id}/logo.png`,
      favicon: tenant.favicon,
      primaryColor: tenant.primaryColor,
      companies: tenant.companies,
    };
  }
}

export const tenantsService = new TenantsService();
