import { prisma } from '../database';

export class AuditService {
  static async log({
    companyId,
    userId,
    action,
    ipAddress,
    userAgent,
    details,
  }: {
    companyId?: string;
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          companyId,
          userId,
          action,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
        },
      });
    } catch (error) {
      // Fail-silent for audit logs so they don't break main business flows
      console.error('[AUDIT_LOG_ERROR] Failed to write audit log:', error);
    }
  }
}
