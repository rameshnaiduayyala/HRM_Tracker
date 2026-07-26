import { Request, Response } from 'express';
import { prisma } from '../../shared/database';
import os from 'os';

export async function getSystemHealth(_req: Request, res: Response) {
  try {
    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const cpus = os.cpus();

    // Check Database Connectivity
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    // Platform Counts
    const [tenantCount, companyCount, userCount, activeSessionsCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.company.count(),
      prisma.user.count(),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);

    res.json({
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: Math.floor(uptimeSeconds),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Generic CPU',
        memory: {
          rssMB: (memoryUsage.rss / 1024 / 1024).toFixed(2),
          heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
          heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          systemFreeMB: (freeMem / 1024 / 1024).toFixed(2),
          systemTotalMB: (totalMem / 1024 / 1024).toFixed(2),
        },
      },
      database: {
        status: 'CONNECTED',
        latencyMs: dbLatencyMs,
      },
      metrics: {
        tenantCount,
        companyCount,
        userCount,
        activeSessionsCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'UNHEALTHY',
      error: error.message || 'Health check failed',
    });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { companyId, limit = '50' } = req.query;

    const where: any = {};
    if (companyId) {
      where.companyId = String(companyId);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 100),
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      logs: logs.map((log: any) => ({
        id: log.id,
        companyId: log.companyId,
        companyName: log.company?.name || 'Platform / Global',
        action: log.action,
        ipAddress: log.ipAddress || '127.0.0.1',
        userAgent: log.userAgent || 'TaskTracky Enterprise System',
        details: log.details || {},
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || 'Failed to fetch audit logs',
    });
  }
}
