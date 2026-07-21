import { prisma } from '../../shared/database';

export class SettingsService {
  async getSettings(companyId: string) {
    let settings = await prisma.companySettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyId,
          workingHoursPerDay: 8,
          screenshotInterval: 60,
          idleThreshold: 300,
          timezone: 'UTC',
          shiftStart: '09:00',
          shiftEnd: '18:00',
        },
      });
    }

    return settings;
  }

  async updateSettings(
    companyId: string,
    data: {
      workingHoursPerDay?: number;
      screenshotInterval?: number;
      idleThreshold?: number;
      timezone?: string;
      shiftStart?: string;
      shiftEnd?: string;
    }
  ) {
    // Ensure settings exist first
    await this.getSettings(companyId);

    return prisma.companySettings.update({
      where: { companyId },
      data,
    });
  }
}

export const settingsService = new SettingsService();
