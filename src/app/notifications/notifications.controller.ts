import httpStatus from "@/constant/httpStatus";
import handleController from "@/helpers/handleController";
import sendResponse from "@/helpers/sendResponse";
import { Request, Response } from "express";
import { NotificationService } from "./notifications.service";

const getAllNotifications = handleController(
  async (req: Request, res: Response) => {
    const result = await NotificationService.getAllNotifications(req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notifications fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const getNotificationById = handleController(
  async (req: Request, res: Response) => {
    const result = await NotificationService.getNotificationById(
      req.params.id!,
      req.user.userId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification fetched successfully",
      data: result,
    });
  }
);

const markAsRead = handleController(async (req: Request, res: Response) => {
  const result = await NotificationService.markAsRead(
    req.params.id!,
    req.user.userId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: result,
  });
});
export const NotificationController = {
  getAllNotifications,
  getNotificationById,
  markAsRead,
};
