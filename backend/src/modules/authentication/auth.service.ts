import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/database';
import {
  ConflictError,
  UnauthorizedError,
} from '../../shared/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  async register(
    tenantId: string,
    data: { email: string; passwordHash: string; firstName: string; lastName: string }
  ) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.passwordHash, 10);

    // Auto-create roles for this tenant if none exist
    let adminRole = await prisma.role.findFirst({
      where: { tenantId, name: 'ADMIN' },
    });

    if (!adminRole) {
      // Create default roles
      adminRole = await prisma.role.create({
        data: { name: 'ADMIN', description: 'Administrator with full access', tenantId },
      });
      await prisma.role.create({
        data: { name: 'MANAGER', description: 'Manager with team level access', tenantId },
      });
      await prisma.role.create({
        data: { name: 'EMPLOYEE', description: 'Standard employee account', tenantId },
      });
      await prisma.role.create({
        data: { name: 'HR', description: 'Human Resource Specialist', tenantId },
      });

      // Let's seed core permissions and map them to the ADMIN role
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
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId,
        roleId: adminRole.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return user;
  }

  async login(
    data: { email: string; passwordHash: string; deviceFingerprint?: string }
  ) {
    const user = await prisma.user.findFirst({
      where: { email: data.email },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.tenant && user.tenant.status !== 'ACTIVE') {
      if (user.tenant.status === 'PENDING') {
        throw new UnauthorizedError('Your workspace registration is currently pending super admin approval. Please try again later.');
      }
      throw new UnauthorizedError('Your company workspace has been deactivated. Please contact support.');
    }

    const isValid = await bcrypt.compare(data.passwordHash, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role?.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
    );

    // Save refresh session to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        deviceFingerprint: data.deviceFingerprint || null,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            role: true,
            tenant: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedError('Session expired or invalid');
    }

    if (session.user.tenant && session.user.tenant.status !== 'ACTIVE') {
      if (session.user.tenant.status === 'PENDING') {
        throw new UnauthorizedError('Your workspace registration is currently pending super admin approval. Please try again later.');
      }
      throw new UnauthorizedError('Your company workspace has been deactivated. Please contact support.');
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        role: session.user.role?.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const newRefreshToken = jwt.sign(
      { userId: session.user.id, tenantId: session.user.tenantId },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as any }
    );

    // Replace session
    await prisma.session.delete({ where: { id: session.id } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: session.user.id,
        token: newRefreshToken,
        deviceFingerprint: session.deviceFingerprint,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
  }
}

export const authService = new AuthService();
