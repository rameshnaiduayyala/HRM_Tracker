import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from './app';
import http from 'http';
import { prisma } from './shared/database';
import bcrypt from 'bcrypt';

let server: http.Server;
let baseUrl: string;
let acmeToken: string;
let acmeCompanyId: string;
let otherCompanyId: string;

beforeAll(async () => {
  // Start server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        baseUrl = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });

  // Login to get admin@acme.com token
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@acme.com', password: 'admin123' }),
  });
  const loginData: any = await loginRes.json();
  acmeToken = loginData.data.accessToken;

  // Retrieve acme company id
  const company = await prisma.company.findFirst({
    where: { name: 'Acme Company' },
  });
  acmeCompanyId = company!.id;

  // Seed another Tenant and Company
  const otherTenant = await prisma.tenant.create({
    data: {
      name: 'Other Tenant',
      subdomain: 'other',
    },
  });

  const otherCompany = await prisma.company.create({
    data: {
      name: 'Other Company',
      tenantId: otherTenant.id,
    },
  });
  otherCompanyId = otherCompany.id;

  // Seed an employee in other company
  const otherRole = await prisma.role.create({
    data: {
      name: 'EMPLOYEE',
      tenantId: otherTenant.id,
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      email: 'employee@other.com',
      passwordHash: await bcrypt.hash('other123', 10),
      firstName: 'Other',
      lastName: 'Employee',
      tenantId: otherTenant.id,
      roleId: otherRole.id,
    },
  });

  await prisma.employee.create({
    data: {
      employeeNum: 'EMP-OTHER',
      userId: otherUser.id,
      companyId: otherCompanyId,
    },
  });
});

afterAll(async () => {
  // Clean up seeded other tenant data
  const otherTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'other' },
  });
  if (otherTenant) {
    await prisma.tenant.delete({
      where: { id: otherTenant.id },
    });
  }

  // Close server
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Backend API Integration Tests & Tenant Isolation', () => {
  it('GET /health returns 200 and database connected status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe('ok');
  });

  it('GET /api/v1/employees/profile without token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/employees/profile`);
    expect(res.status).toBe(401);
  });

  it('Acme Admin can fetch Acme Company employees', async () => {
    const res = await fetch(`${baseUrl}/api/v1/employees?companyId=${acmeCompanyId}`, {
      headers: { 'Authorization': `Bearer ${acmeToken}` },
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.status).toBe('success');
    expect(data.data.employees.length).toBeGreaterThan(0);
  });

  it('Acme Admin CANNOT fetch Other Company employees (Tenant Isolation)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/employees?companyId=${otherCompanyId}`, {
      headers: { 'Authorization': `Bearer ${acmeToken}` },
    });
    
    // We expect 403 Forbidden or 404 Not Found due to tenant boundary validation
    expect(res.status).toBe(403);
  });

  it('Acme Admin can register device and list registered devices', async () => {
    const regRes = await fetch(`${baseUrl}/api/v1/devices/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${acmeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fingerprint: 'test-fingerprint-uuid-abc-123',
        name: 'Developer Laptop X1',
      }),
    });
    expect(regRes.status).toBe(200);
    const regData: any = await regRes.json();
    expect(regData.status).toBe('success');
    expect(regData.data.device.fingerprint).toBe('test-fingerprint-uuid-abc-123');

    const listRes = await fetch(`${baseUrl}/api/v1/devices`, {
      headers: { 'Authorization': `Bearer ${acmeToken}` },
    });
    expect(listRes.status).toBe(200);
    const listData: any = await listRes.json();
    expect(listData.status).toBe('success');
    expect(listData.data.devices.length).toBeGreaterThan(0);
    expect(listData.data.devices[0].fingerprint).toBe('test-fingerprint-uuid-abc-123');

    // Clean up created device
    await prisma.device.delete({
      where: { fingerprint: 'test-fingerprint-uuid-abc-123' },
    });
  });
});
