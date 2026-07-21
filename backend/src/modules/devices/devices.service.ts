import { prisma } from '../../shared/database';

export class DevicesService {
  async registerDevice(userId: string, data: { fingerprint: string; name?: string }) {
    const existing = await prisma.device.findUnique({
      where: { fingerprint: data.fingerprint },
    });

    if (existing) {
      return prisma.device.update({
        where: { id: existing.id },
        data: {
          userId,
          name: data.name || existing.name,
          lastUsedAt: new Date(),
        },
      });
    }

    return prisma.device.create({
      data: {
        fingerprint: data.fingerprint,
        userId,
        name: data.name || 'Unknown Device',
        status: 'APPROVED',
      },
    });
  }

  async getDevicesByUser(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }
}

export const devicesService = new DevicesService();
