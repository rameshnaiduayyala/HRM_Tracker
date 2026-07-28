import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/database';
import crypto from 'crypto';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors';
import { sendEmail } from '../../shared/utils/email';
import { generateForgotPasswordEmailHTML, generatePasswordUpdatedEmailHTML } from '../../shared/templates/emails';

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

    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
      include: { company: true }
    });

    // Block login for employees who have been offboarded / relieved
    if (employee && employee.status === 'INACTIVE') {
      throw new UnauthorizedError(
        'Your employment has been relieved. Access to this system has been revoked. Please contact HR for further assistance.'
      );
    }

    let company = employee?.company || null;

    if (!company && user.tenantId) {
      company = await prisma.company.findFirst({
        where: { tenantId: user.tenantId }
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
        profilePic: employee?.profilePic || null,
        company: company ? {
          id: company.id,
          name: company.name,
          logoUrl: company.logo,
        } : null,
      },
    };
  }

  async loginLegacy(
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

    const legacyExpiry = process.env.JWT_LEGACY_EXPIRES_IN || '365d';

    const accessToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, role: user.role?.name, legacy: true },
      JWT_SECRET,
      { expiresIn: legacyExpiry as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId, legacy: true },
      JWT_REFRESH_SECRET,
      { expiresIn: legacyExpiry as any }
    );

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });

    return true;
  }

  /**
   * 1. Request Password Reset (Forgot Password)
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Return success to avoid email enumeration attacks
      return true;
    }

    // Generate random secure token & 1 hour expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: expiresAt,
      },
    });

    // Fetch company details for branding
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
      include: { company: true },
    });
    const compName = employee?.company?.name || 'FocusTrack Enterprise';
    const compLogo = employee?.company?.logo || undefined;
    const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/login?resetToken=${resetToken}`;

    const emailHtml = generateForgotPasswordEmailHTML({
      userName: `${user.firstName} ${user.lastName}`,
      resetUrl,
      companyName: compName,
      companyLogo: compLogo,
    });

    sendEmail({
      to: user.email,
      subject: `Password Reset Request - ${compName}`,
      html: emailHtml,
    });

    return true;
  }

  /**
   * 2. Reset Password with Token
   */
  async resetPassword(token: string, newPasswordHash: string) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(newPasswordHash, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Fetch company details for branding
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
      include: { company: true },
    });
    const compName = employee?.company?.name || 'FocusTrack Enterprise';
    const compLogo = employee?.company?.logo || undefined;

    // Send confirmation email
    const confirmHtml = generatePasswordUpdatedEmailHTML({
      userName: `${user.firstName} ${user.lastName}`,
      companyName: compName,
      companyLogo: compLogo,
    });

    sendEmail({
      to: user.email,
      subject: `Security Alert: Password Updated - ${compName}`,
      html: confirmHtml,
    });

    return true;
  }

  /**
   * 3. Change Password (Authenticated User)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError('Current password provided is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Send security notification email
    const changeHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; borderRadius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Security Alert: Password Changed</h2>
        <p style="font-size: 14px;">Hi <strong>${user.firstName} ${user.lastName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">Your FocusTrack account password was just changed from account settings.</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">If you did not make this change, please inform your HR or IT team immediately.</p>
      </div>
    `;

    sendEmail({
      to: user.email,
      subject: 'Security Alert: Account Password Changed',
      html: changeHtml,
    });

    return true;
  }
}

export const authService = new AuthService();
