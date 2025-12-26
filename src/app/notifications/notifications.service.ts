import httpStatus from "@/constant/httpStatus";
import AppError from "@/helpers/AppError";
import { executePaginatedQuery } from "@/helpers/pagination";
import { prisma } from "@/lib/db";
import type { Request } from "express";

/**
 * Get all Notifications for a user
 */
const getAllNotifications = async (req: Request) => {
  const userId = req.user?.userId;

  const { data, meta } = await executePaginatedQuery<any, any>(
    req,
    prisma.notification,
    {
      searchFields: ["title", "message"],
      filterFields: ["isRead", "isForAllUsers"],
      defaultLimit: 10,
      maxLimit: 50,
      defaultSortBy: "createdAt",
      defaultSortOrder: "desc",
      customFilters(req, where) {
        // Fetch notifications specifically for the user OR global notifications
        where.OR = [{ userId: userId }, { isForAllUsers: true }];
      },
    }
  );

  prisma.notification.updateMany({
    where: { userId: userId, isRead: false },
    data: { isRead: true },
  });

  return { data, meta };
};

/**
 * Get Single Notification by ID
 */
const getNotificationById = async (id: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id,
      OR: [{ userId }, { isForAllUsers: true }],
    },
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  return notification;
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (id: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
    select: { id: true, isRead: true, updatedAt: true },
  });
};

/**
 * Mark all user notifications as read
 */
const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const NotificationService = {
  getAllNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
};
