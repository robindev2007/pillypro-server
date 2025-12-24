import { authorize } from "@/middleware/auth.middleware";
import express from "express";
import { NotificationController } from "./notifications.controller";

const router = express.Router();

router.get("/", authorize(), NotificationController.getAllNotifications);
router.get("/:id", authorize(), NotificationController.getNotificationById);
router.patch("/:id/read", authorize(), NotificationController.markAsRead);

export const NotificationRoutes = router;
