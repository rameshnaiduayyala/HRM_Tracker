import { prisma } from '../../shared/database';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import { storageService } from '../../infrastructure/s3';
import fs from 'fs';
import path from 'path';

// Default config values (used when CompanySettings row doesn't exist yet)
const DEFAULT_SCREENSHOT_INTERVAL = 60;  // seconds
const DEFAULT_IDLE_THRESHOLD       = 300; // seconds (5 minutes)

export class WorkSessionsService {
  async getEmployeeProfile(userId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundError('Employee profile not found for this user');
    }
    return employee;
  }

  /**
   * Returns the company-level agent configuration for the authenticated employee.
   * The desktop agent fetches this on every session start so intervals are always
   * up-to-date without requiring a re-login.
   */
  async getAgentConfig(userId: string): Promise<{
    screenshotInterval: number;
    idleThreshold: number;
    workingHoursPerDay: number;
  }> {
    const employee = await this.getEmployeeProfile(userId);

    const settings = await prisma.companySettings.findUnique({
      where: { companyId: employee.companyId },
      select: {
        screenshotInterval: true,
        idleThreshold: true,
        workingHoursPerDay: true,
      },
    });

    return {
      screenshotInterval: settings?.screenshotInterval ?? DEFAULT_SCREENSHOT_INTERVAL,
      idleThreshold:      settings?.idleThreshold      ?? DEFAULT_IDLE_THRESHOLD,
      workingHoursPerDay: settings?.workingHoursPerDay ?? 8,
    };
  }

  async startSession(userId: string) {
    const employee = await this.getEmployeeProfile(userId);

    // Verify no running session exists
    const active = await prisma.workSession.findFirst({
      where: {
        employeeId: employee.id,
        status: 'RUNNING',
      },
    });

    if (active) {
      throw new BadRequestError('A work session is already active');
    }

    return prisma.workSession.create({
      data: {
        employeeId: employee.id,
        status: 'RUNNING',
      },
    });
  }

  async stopSession(userId: string, stopReason?: string) {
    const employee = await this.getEmployeeProfile(userId);

    const active = await prisma.workSession.findFirst({
      where: {
        employeeId: employee.id,
        status: 'RUNNING',
      },
    });

    if (!active) {
      throw new BadRequestError('No active work session found');
    }

    return prisma.workSession.update({
      where: { id: active.id },
      data: {
        status: 'COMPLETED',
        end: new Date(),
        stopReason,
      },
    });
  }

  async logHeartbeat(
    userId: string,
    data: {
      app: string;
      windowTitle?: string;
      idleDuration: number; // in seconds
      activeDuration: number; // in seconds
    }
  ) {
    const employee = await this.getEmployeeProfile(userId);

    const active = await prisma.workSession.findFirst({
      where: {
        employeeId: employee.id,
        status: 'RUNNING',
      },
    });

    if (!active) {
      throw new BadRequestError('Heartbeat ignored: No active work session');
    }

    const total = data.idleDuration + data.activeDuration;
    const percentage = total > 0 ? (data.activeDuration / total) * 100 : 100.0;

    return prisma.activity.create({
      data: {
        workSessionId: active.id,
        app: data.app,
        windowTitle: data.windowTitle || null,
        idleDuration: data.idleDuration,
        activeDuration: data.activeDuration,
        percentage,
      },
    });
  }

  async uploadScreenshot(userId: string, imageBase64: string) {
    const employee = await this.getEmployeeProfile(userId);

    const active = await prisma.workSession.findFirst({
      where: {
        employeeId: employee.id,
        status: 'RUNNING',
      },
    });

    if (!active) {
      throw new BadRequestError('Screenshot rejected: No active work session');
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const relativeFilePath = `screenshots/${active.id}/${Date.now()}.png`;

    let storagePath = `/uploads/${relativeFilePath}`;
    try {
      await storageService.uploadFile(relativeFilePath, buffer, 'image/png');
      storagePath = relativeFilePath;
    } catch (err: any) {
      // Save locally inside backend/uploads/screenshots/ directory
      const localPath = path.join(__dirname, '../../../uploads', relativeFilePath);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, buffer);
      storagePath = `/uploads/${relativeFilePath}`;
    }

    return prisma.screenshot.create({
      data: {
        workSessionId: active.id,
        storagePath,
      },
    });
  }

  async updateLastSessionReason(userId: string, stopReason: string) {
    const employee = await this.getEmployeeProfile(userId);
    const lastSession = await prisma.workSession.findFirst({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' }
    });
    if (!lastSession) {
      throw new BadRequestError('No work session found');
    }
    return prisma.workSession.update({
      where: { id: lastSession.id },
      data: { stopReason }
    });
  }
}

export const workSessionsService = new WorkSessionsService();
