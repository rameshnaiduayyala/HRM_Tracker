import { prisma } from '../../shared/database';
import { NotFoundError } from '../../shared/errors';

export class NotificationsService {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(userId: string, title: string, message: string, type = 'INFO', link?: string) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  }
}

export const notificationsService = new NotificationsService();
