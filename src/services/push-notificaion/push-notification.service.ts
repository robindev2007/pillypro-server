import { prisma } from "@/lib/db";
import admin, { ServiceAccount } from "firebase-admin";
import { ServiceAccountToken } from "./push-notification.constant";

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccountToken as ServiceAccount),
});

const sendPushNotificationToDevice = async ({
  tokens,
  title,
  body,
}: {
  tokens: string[];
  title: string;
  body: string;
}) => {
  const message: admin.messaging.MulticastMessage = {
    notification: { title, body },
    tokens,
    android: {
      priority: "high", // set high priority for Android
    },
    apns: {
      headers: {
        "apns-priority": "10", // set high priority for iOS
      },
    },
  };

  try {
    const res = await admin.messaging().sendEachForMulticast(message);
    console.log(res.responses);
    return res;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

const sendPushNotificationByUserId = async (
  userId: string,
  title: string,
  body: string
) => {
  // Fetch user's FCM tokens from database
  // Assuming you have a function getUserFcmTokens that retrieves tokens by userId
  const userData = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      fcmTokens: true,
    },
  });

  if (userData?.fcmTokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}`);
    return;
  }

  return await sendPushNotificationToDevice({
    tokens: userData?.fcmTokens || [],
    title,
    body,
  });
};

const sendPushNotificationToAllUsers = async (title: string, body: string) => {
  // Fetch all users' FCM tokens from database
  const usersData = await prisma.user.findMany({
    where: {
      fcmTokens: {
        hasSome: [], // Ensure we only get users with at least one FCM token
      },
    },
    select: {
      fcmTokens: true,
    },
  });
  const allTokens = usersData.flatMap((user) => user.fcmTokens);
  if (allTokens.length === 0) {
    console.log("No FCM tokens found for any user");
    return;
  }
  return await sendPushNotificationToDevice({
    tokens: allTokens,
    title,
    body,
  });
};

export const PushNotificationService = {
  sendPushNotificationToDevice,
  sendPushNotificationByUserId,
  sendPushNotificationToAllUsers,
};
