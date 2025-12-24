import { prisma } from "@/lib/db";
import admin, { ServiceAccount } from "firebase-admin";
import { ServiceAccountToken } from "./push-notification.constant";

// Prevent multiple initializations
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(ServiceAccountToken as ServiceAccount),
  });
}

/**
 * Sends a push notification to all registered devices of a specific user.
 * @param userId - The ID of the user to notify
 * @param payload - Object containing title and body strings
 */
const sendNotification = async (
  userId: string,
  payload: { title: string; body: string }
) => {
  const { title, body } = payload;

  // 1. Fetch user tokens from the database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmTokens: true },
  });

  if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
    console.warn(`[PushService] No active FCM tokens for User ID: ${userId}`);
    return null;
  }

  // 2. Prepare the Multicast message for multiple devices
  const message: admin.messaging.MulticastMessage = {
    tokens: user.fcmTokens,
    notification: { title, body },
    android: {
      priority: "high",
      notification: { channelId: "medication_reminders" }, // Good for high-priority alerts
    },
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // 3. Cleanup: Check for invalid/expired tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error?.code;
          if (
            error === "messaging/registration-token-not-registered" ||
            error === "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(user.fcmTokens[idx] as string);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            fcmTokens: {
              set: user.fcmTokens.filter(
                (token) => !invalidTokens.includes(token)
              ),
            },
          },
        });
        console.log(
          `[PushService] Pruned ${invalidTokens.length} stale tokens for user ${userId}`
        );
      }
    }

    return response;
  } catch (error) {
    console.error("[PushService] Failed to dispatch notification:", error);
    // Throwing allows BullMQ to catch the error and retry the job later
    throw error;
  }
};

export const PushNotificationService = {
  sendNotification,
};
