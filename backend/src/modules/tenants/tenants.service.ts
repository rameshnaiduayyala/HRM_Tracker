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
    planId?: string;
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

    // Run creation in a single transaction
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
        data: { name: 'ADMIN', description: 'Administrator with full access', tenantId: tenant.id },
      });
      await tx.role.create({
        data: { name: 'MANAGER', description: 'Manager with team level access', tenantId: tenant.id },
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

      // 6. Create Subscription for Company
      let targetPlanId = data.planId;
      if (!targetPlanId) {
        const defaultPlan = await tx.plan.findFirst({
          orderBy: { price: 'asc' },
        });
        if (defaultPlan) {
          targetPlanId = defaultPlan.id;
        }
      }

      if (targetPlanId) {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year default subscription
        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: targetPlanId,
            status: data.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
            startDate: new Date(),
            endDate,
          },
        });
      }

      return { tenant, company, user };
    });
  }

  async activateSubscription(companyId: string, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Selected plan not found');

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
          status: 'ACTIVE',
          endDate,
        },
      });
    } else {
      return prisma.subscription.create({
        data: {
          companyId,
          planId,
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
        companies: {
          include: {
            _count: {
              select: { employees: true },
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
      return sum + Number(sub.plan.price);
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
}

export const tenantsService = new TenantsService();
