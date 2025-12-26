// app.ts
import { MedicineType, SlotType } from "@/prisma/generated/enums";
import { apiReference } from "@scalar/express-api-reference";
import compression from "compression";
import cookieParser from "cookie-parser";
import dayjs from "dayjs";
import express from "express";
import path from "path";
import favicon from "serve-favicon";
import env from "./config/env";
import httpStatus from "./constant/httpStatus";
import { prisma } from "./lib/db";
import { attachUser } from "./middleware/auth.middleware";
import errorMiddleware from "./middleware/error.middleware";
import fancyLogger from "./middleware/logger.middleware";
import routes from "./routes";
import { PushNotificationService } from "./services/push-notificaion/push-notification.service";
import { generatePostmanDoc } from "./utils/generatePostmanDoc";
import { logger } from "./utils/logger";

const app = express();

// favicon
app.use(favicon(path.join(process.cwd(), "public", "favicon.ico")));

// 1. Compression (first for best performance)
app.use(
  compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// 2. Parsers (reduced limits for better performance)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(process.cwd() + "/uploads"));
app.use("/public", express.static(process.cwd() + "/public"));

// 3. Logger (only in development)
if (env.NODE_ENV === "development") {
  app.use(fancyLogger({ logBody: true }));
}

// 4. Global middleware to attach user data if token exists (optional)
app.use(attachUser);
app.use(
  "/reference",
  apiReference({
    theme: "purple",
    url: "http://localhost:5001/zod",
  })
);

app.get("/zod", async (req, res) => {
  const dock = await generatePostmanDoc();

  return res.json(dock);
});

// 5. Routes
app.get("/", async (req, res) => {
  // const a = await seedFrequentDoseData();
  const data = await prisma.user.findFirst({
    where: { email: "1@gmail.com" },
  });

  await data?.fcmTokens.map(async (token) => {
    await PushNotificationService.sendNotification(data.id, {
      title: "Test Notification",
      body: "This is a test notification from Pilly Pro.",
    });
  });

  res.json({
    status: "success",
    message: `Welcome to the ${env.PROJECT_NAME} API`,
    data: { data },
  });
});

app.use("/api/v1", routes);

// 6. Handle unhandled routes (404)
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: "The requested resource was not found on this server.",
    data: {
      path: req.originalUrl,
      fullPath: req.protocol + "://" + req.get("host") + req.originalUrl,
      method: req.method,
    },
  });
});

// 7. Error handler (always last)
app.use(errorMiddleware);

export default app;

const seedFrequentDoseData = async () => {
  const targetEmail = "1@gmail.com";
  const user = await prisma.user.findUnique({ where: { email: targetEmail } });

  if (!user) return logger.error("User not found");

  // Generate 10-minute intervals: ["12:00 AM", "12:10 AM", "12:20 AM", ...]
  const frequentTimes = generateIntervalTimes(10, 144); // 144 doses covers 24 hours

  logger.info(`🚀 Seeding frequent dose medicine...`);

  const slot = await prisma.medicineSlot.create({
    data: {
      userId: user.id,
      doseName: "High Frequency Test Med",
      medicineType: MedicineType.PILL,
      slotType: SlotType.SMALL,
      totalPills: 1000,
      startDate: dayjs().subtract(1, "day").toDate(),
      endDate: dayjs().add(7, "days").toDate(),
      timezone: "Asia/Dhaka",
      isActive: true,
      notificationEnabled: true,
      // Use the generated 10-minute interval times
      medicineTimes: frequentTimes,
    },
  });

  logger.info(`✅ Created slot with ${frequentTimes.length} doses per day.`);
  return slot;
};

/**
 * Generates an array of time strings in "hh:mm A" format
 * spaced out by a specific interval.
 * * @param intervalMinutes - Gap between doses (default 10)
 * @param count - How many doses to generate (default 24 for a full cycle)
 */
export const generateIntervalTimes = (
  intervalMinutes = 10,
  count = 24
): string[] => {
  const times: string[] = [];
  // Start at a clean hour (e.g., 12:00 AM)
  let current = dayjs().startOf("day");

  for (let i = 0; i < count; i++) {
    // "hh:mm A" yields "01:00 AM", "01:10 AM", etc.
    times.push(current.format("hh:mm A"));
    current = current.add(intervalMinutes, "minute");
  }

  return times;
};
