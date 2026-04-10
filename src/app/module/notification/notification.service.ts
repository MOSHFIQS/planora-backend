import { prisma } from "../../lib/prisma";
import { NotificationType } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

export const NotificationService = {
  sendNotification: async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    eventId?: string,
    paymentId?: string,
    metadata?: any
  ) => {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          eventId,
          paymentId,
          metadata: metadata ? metadata : undefined,
        },
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  },

  getMyNotifications: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  markAsRead: async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(status.NOT_FOUND, "Notification not found");
    }

    if (notification.userId !== userId) {
      throw new AppError(status.FORBIDDEN, "Unauthorized");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
