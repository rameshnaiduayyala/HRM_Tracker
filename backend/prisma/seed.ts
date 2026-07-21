import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Plans
  await prisma.plan.upsert({
    where: { name: 'BASIC' },
    update: {},
    create: {
      name: 'BASIC',
      price: 10.0,
      billingCycle: 'MONTHLY',
      employeeLimit: 5,
      features: ['Attendance Tracking', 'Basic Activity Monitoring'],
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'PRO' },
    update: {},
    create: {
      name: 'PRO',
      price: 29.0,
      billingCycle: 'MONTHLY',
      employeeLimit: 20,
      features: ['Attendance Tracking', 'Detailed Activity Monitoring', 'Screenshots', 'Task Management'],
    },
  });

  await prisma.plan.upsert({
    where: { name: 'ENTERPRISE' },
    update: {},
    create: {
      name: 'ENTERPRISE',
      price: 99.0,
      billingCycle: 'MONTHLY',
      employeeLimit: 9999,
      features: ['All Features', 'Dedicated Support', 'Custom Integrations', 'AI Insights'],
    },
  });
  console.log('Billing plans seeded');

  // 2. Seed Tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'acme' },
    update: {},
    create: {
      name: 'Acme Corp',
      subdomain: 'acme',
      status: 'ACTIVE',
    },
  });
  console.log(`Tenant seeded: ${tenant.name} (${tenant.id})`);

  // 3. Seed Company under Tenant
  let company = await prisma.company.findFirst({
    where: { name: 'Acme Company', tenantId: tenant.id },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Acme Company',
        tenantId: tenant.id,
      },
    });
  }
  console.log(`Company seeded: ${company.name} (${company.id})`);

  // 4. Seed Active Subscription for Company
  const existingSub = await prisma.subscription.findFirst({
    where: { companyId: company.id },
  });

  if (!existingSub) {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year active subscription
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: proPlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
      },
    });
    console.log('Default subscription seeded');
  }

  // 5. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'ADMIN',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
      tenantId: tenant.id,
    },
  });

  await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'MANAGER',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Manager with team level access',
      tenantId: tenant.id,
    },
  });

  await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'EMPLOYEE',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Standard employee account',
      tenantId: tenant.id,
    },
  });
  await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'HR',
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      name: 'HR',
      description: 'Human Resource Specialist',
      tenantId: tenant.id,
    },
  });
  console.log('Roles seeded');

  // 6. Seed Permissions
  const permissionsList = [
    { action: 'users:read', description: 'View users' },
    { action: 'users:write', description: 'Create and update users' },
    { action: 'tasks:read', description: 'View tasks' },
    { action: 'tasks:write', description: 'Create and edit tasks' },
    { action: 'reports:view', description: 'View reports' },
  ];

  for (const perm of permissionsList) {
    const dbPerm = await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: dbPerm.id,
      },
    });
  }
  console.log('Permissions seeded & mapped to ADMIN role');

  // Seed Global SUPER_ADMIN role (tenantId = null)
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', tenantId: null },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Global Platform Super Administrator',
        tenantId: null,
      },
    });
  }

  // Seed Super Admin User (tenantId = null)
  const superAdminEmail = 'superadmin@tasktracky.com';
  let superAdminUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!superAdminUser) {
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        firstName: 'Platform',
        lastName: 'SuperAdmin',
        tenantId: null,
        roleId: superAdminRole.id,
      },
    });
    console.log(`Super Admin User seeded: ${superAdminUser.email}`);
  }

  // 7. Seed Admin User and associated Employee record
  const adminEmail = 'admin@acme.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        tenantId: tenant.id,
        roleId: adminRole.id,
      },
    });
    console.log(`User seeded: ${adminUser.email}`);
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: { userId: adminUser.id },
  });

  if (!existingEmployee) {
    await prisma.employee.create({
      data: {
        employeeNum: 'EMP-00001',
        userId: adminUser.id,
        companyId: company.id,
        status: 'ACTIVE',
        designation: 'Principal Administrator',
      },
    });
    console.log('Associated Employee record seeded');
  }

  // Seed Manager User and associated Employee record
  const managerRole = await prisma.role.findFirst({
    where: { name: 'MANAGER', tenantId: tenant.id },
  });
  const managerEmail = 'manager@acme.com';
  let managerUser = await prisma.user.findUnique({
    where: { email: managerEmail },
  });

  if (!managerUser && managerRole) {
    const passwordHash = await bcrypt.hash('manager123', 10);
    managerUser = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Manager',
        tenantId: tenant.id,
        roleId: managerRole.id,
      },
    });
    console.log(`User seeded: ${managerUser.email}`);

    await prisma.employee.create({
      data: {
        employeeNum: 'EMP-00002',
        userId: managerUser.id,
        companyId: company.id,
        status: 'ACTIVE',
        designation: 'Department Manager',
      },
    });
    console.log('Associated Manager Employee record seeded');
  }

  // Seed Employee User and associated Employee record
  const employeeRole = await prisma.role.findFirst({
    where: { name: 'EMPLOYEE', tenantId: tenant.id },
  });
  const employeeEmail = 'employee@acme.com';
  let employeeUser = await prisma.user.findUnique({
    where: { email: employeeEmail },
  });

  if (!employeeUser && employeeRole) {
    const passwordHash = await bcrypt.hash('employee123', 10);
    employeeUser = await prisma.user.create({
      data: {
        email: employeeEmail,
        passwordHash,
        firstName: 'Alex',
        lastName: 'Developer',
        tenantId: tenant.id,
        roleId: employeeRole.id,
      },
    });
    console.log(`User seeded: ${employeeUser.email}`);

    const managerEmp = await prisma.employee.findFirst({
      where: { userId: managerUser?.id || '' },
    });

    await prisma.employee.create({
      data: {
        employeeNum: 'EMP-00003',
        userId: employeeUser.id,
        companyId: company.id,
        managerId: managerEmp?.id || null,
        status: 'ACTIVE',
        designation: 'Software Engineer',
      },
    });
    console.log('Associated Developer Employee record seeded');
  }

  // Seed HR User and associated Employee record
  const hrRole = await prisma.role.findFirst({
    where: { name: 'HR', tenantId: tenant.id },
  });
  const hrEmail = 'hr@acme.com';
  let hrUser = await prisma.user.findUnique({
    where: { email: hrEmail },
  });

  if (!hrUser && hrRole) {
    const passwordHash = await bcrypt.hash('hr123', 10);
    hrUser = await prisma.user.create({
      data: {
        email: hrEmail,
        passwordHash,
        firstName: 'Helen',
        lastName: 'Resource',
        tenantId: tenant.id,
        roleId: hrRole.id,
      },
    });
    console.log(`User seeded: ${hrUser.email}`);

    await prisma.employee.create({
      data: {
        employeeNum: 'EMP-00004',
        userId: hrUser.id,
        companyId: company.id,
        status: 'ACTIVE',
        designation: 'HR Lead Specialist',
      },
    });
    console.log('Associated HR Employee record seeded');
  }

  // Seed Additional Staff Employees
  const extraStaff = [
    { email: 'emily.designer@acme.com', firstName: 'Emily', lastName: 'Designer', designation: 'UI/UX Lead Designer', num: 'EMP-00005' },
    { email: 'david.qa@acme.com', firstName: 'David', lastName: 'Quality', designation: 'Senior QA Engineer', num: 'EMP-00006' },
    { email: 'jessica.pm@acme.com', firstName: 'Jessica', lastName: 'Product', designation: 'Product Manager', num: 'EMP-00007' },
    { email: 'michael.dev@acme.com', firstName: 'Michael', lastName: 'Backend', designation: 'Fullstack Engineer', num: 'EMP-00008' }
  ];

  for (const staff of extraStaff) {
    let u = await prisma.user.findUnique({ where: { email: staff.email } });
    if (!u && employeeRole) {
      const passwordHash = await bcrypt.hash('employee123', 10);
      u = await prisma.user.create({
        data: {
          email: staff.email,
          passwordHash,
          firstName: staff.firstName,
          lastName: staff.lastName,
          tenantId: tenant.id,
          roleId: employeeRole.id,
        },
      });
      await prisma.employee.create({
        data: {
          employeeNum: staff.num,
          userId: u.id,
          companyId: company.id,
          status: 'ACTIVE',
          designation: staff.designation,
        },
      });
      console.log(`Seeded staff employee: ${staff.firstName} ${staff.lastName}`);
    }
  }

  // Seed default CompanySettings
  const existingSettings = await prisma.companySettings.findUnique({
    where: { companyId: company.id },
  });
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyId: company.id,
        workingHoursPerDay: 8,
        screenshotInterval: 60,
        idleThreshold: 300,
        timezone: 'UTC',
        shiftStart: '09:00',
        shiftEnd: '18:00',
      },
    });
    console.log('Default CompanySettings seeded');
  }

  // Seed default LeaveTypes
  const leaveTypesList = [
    { name: 'Annual Leave', allowedDays: 15, isPaid: true },
    { name: 'Sick Leave', allowedDays: 10, isPaid: true },
    { name: 'Casual Leave', allowedDays: 7, isPaid: true },
    { name: 'WFH', allowedDays: 30, isPaid: true },
  ];

  for (const lt of leaveTypesList) {
    await prisma.leaveType.upsert({
      where: {
        name_companyId: {
          name: lt.name,
          companyId: company.id,
        },
      },
      update: {},
      create: {
        name: lt.name,
        companyId: company.id,
        allowedDays: lt.allowedDays,
        isPaid: lt.isPaid,
      },
    });
  }
  console.log('Default LeaveTypes seeded');

  // Seed default LeaveBalances for employee Alex Developer
  if (employeeUser) {
    const alexEmp = await prisma.employee.findFirst({
      where: { userId: employeeUser.id },
    });
    if (alexEmp) {
      const dbLeaveTypes = await prisma.leaveType.findMany({
        where: { companyId: company.id },
      });
      for (const lt of dbLeaveTypes) {
        const existingBalance = await prisma.leaveBalance.findFirst({
          where: {
            employeeId: alexEmp.id,
            leaveTypeId: lt.id,
            year: new Date().getFullYear(),
          },
        });
        if (!existingBalance) {
          await prisma.leaveBalance.create({
            data: {
              employeeId: alexEmp.id,
              leaveTypeId: lt.id,
              year: new Date().getFullYear(),
              used: 0,
              total: lt.allowedDays,
            },
          });
        }
      }
      console.log('LeaveBalances seeded for Employee Alex');
    }
  }

  // Seed Feature Flags
  const featureFlags = [
    { key: 'screenshots', label: 'Screenshot Monitoring', isGlobal: true },
    { key: 'leave_management', label: 'Leave Management Module', isGlobal: true },
    { key: 'activity_tracking', label: 'Activity Monitoring', isGlobal: true },
    { key: 'billing', label: 'Billing and Invoices', isGlobal: true },
  ];

  for (const ff of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: ff.key },
      update: {},
      create: ff,
    });
  }
  console.log('Default Feature Flags seeded');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
