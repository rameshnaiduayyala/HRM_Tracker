import { prisma } from '../../shared/database';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import { storageService } from '../../infrastructure/s3';
import fs from 'fs';
import path from 'path';

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

  async stopSession(userId: string) {
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
      const localPath = path.join(__dirname, '../../../../uploads', relativeFilePath);
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
}

export const workSessionsService = new WorkSessionsService();
