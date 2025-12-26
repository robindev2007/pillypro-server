import { prisma } from "@/lib/db";
import { MedicineSlot } from "@/prisma/generated/client";
import { PushNotificationService } from "@/services/push-notificaion/push-notification.service";
import { logger } from "@/utils/logger";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import cron from "node-cron";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Types for better clarity
type SlotWithUser = MedicineSlot & {
  user: { id: string; email: string; fcmTokens: string[] };
};

let isRunning = false;
let runCount = 0;

/**
 * Logic to handle push notification triggers
 */
async function handleNotifications(
  slot: SlotWithUser,
  scheduledToday: Dayjs,
  now: Dayjs,
  timeStr: string
): Promise<boolean> {
  const notifyWindowStart = scheduledToday.subtract(15, "minute");
  const isInsideNotifyWindow =
    now.isAfter(notifyWindowStart) && now.isBefore(scheduledToday);

  if (
    slot.notificationEnabled &&
    isInsideNotifyWindow &&
    !slot.notificationSent
  ) {
    try {
      console.log(
        `   [Action] Sending Push to ${slot.user.email} for ${slot.doseName}...`
      );
      await PushNotificationService.sendNotification(slot.userId, {
        title: "Medication Reminder 💊",
        body: `It's almost time for your ${slot.doseName} (${timeStr}).`,
      });

      await prisma.medicineSlot.update({
        where: { id: slot.id },
        data: { notificationSent: true },
      });
      return true;
    } catch (pushErr) {
      console.error(`   ⚠️ PUSH FAILED for ${slot.user.email}:`, pushErr);
    }
  }
  return false;
}

/**
 * Logic to handle missed dose recording
 */
async function handleMissedDoses(
  slot: SlotWithUser,
  scheduledToday: Dayjs,
  now: Dayjs,
  timeStr: string
): Promise<boolean> {
  const missedThreshold = scheduledToday.add(4, "hour");

  if (now.isAfter(missedThreshold)) {
    const existingHistory = await prisma.medicineHistory.findFirst({
      where: {
        slotId: slot.id,
        slotTime: timeStr,
        createdAt: {
          gte: now.startOf("day").toDate(),
          lte: now.endOf("day").toDate(),
        },
      },
    });

    if (!existingHistory) {
      console.log(
        `   [Action] Recording MISSED for ${slot.doseName} (${slot.user.email})...`
      );
      await prisma.medicineHistory.create({
        data: {
          userId: slot.userId,
          slotId: slot.id,
          status: "MISSED",
          slotTime: timeStr,
        },
      });
      return true;
    }
  }
  return false;
}

/**
 * Main Worker Function
 */
const initWorkers = () => {
  logger.info("🛠️  Initializing Modular Workers (Push & Tracker)...");

  cron.schedule("*/10 * * * * *", async () => {
    if (isRunning) return;
    isRunning = true;

    const startTime = Date.now();
    const now = dayjs();
    let stats = { scanned: 0, notified: 0, missed: 0 };

    console.log("\n" + "=".repeat(70));
    logger.info(`🔍 CRON [Run #${runCount++}] | ${now.format("HH:mm:ss")}`);
    console.log("-".repeat(70));

    try {
      // 1. Fetch Data
      const activeSlots = (await prisma.medicineSlot.findMany({
        where: { isActive: true, endDate: { gte: now.toDate() } },
        include: {
          user: { select: { id: true, email: true, fcmTokens: true } },
        },
      })) as SlotWithUser[];

      stats.scanned = activeSlots.length;

      if (stats.scanned === 0) {
        console.log("ℹ️  STATUS: No active medicine slots found.");
      } else {
        for (const slot of activeSlots) {
          let userTz = slot.timezone || "UTC";
          if (userTz.includes("GMT")) userTz = "UTC";

          for (const timeStr of slot.medicineTimes) {
            const scheduledToday = dayjs
              .tz(timeStr, "hh:mm A", userTz)
              .year(now.year())
              .month(now.month())
              .date(now.date());

            // 2. Run Notification Logic
            if (await handleNotifications(slot, scheduledToday, now, timeStr)) {
              stats.notified++;
            }

            // 3. Run Missed Dose Logic
            if (await handleMissedDoses(slot, scheduledToday, now, timeStr)) {
              stats.missed++;
            }
          }
        }
      }

      // 4. Midnight Reset Logic (Important)
      if (now.hour() === 0 && now.minute() === 0 && now.second() < 15) {
        console.log("♻️  MIDNIGHT RESET: Clearing notification flags...");
        await prisma.medicineSlot.updateMany({
          where: { notificationSent: true },
          data: { notificationSent: false },
        });
      }
    } catch (error) {
      logger.error("🔴 Worker Error:", error as any);
    } finally {
      const duration = Date.now() - startTime;
      console.log("-".repeat(70));
      console.log(
        `📊 SUMMARY: Scanned: ${stats.scanned} | Notified: ${stats.notified} | Missed: ${stats.missed}`
      );
      logger.info(`✅ DONE | Time: ${duration}ms`);
      console.log("=".repeat(70) + "\n");
      isRunning = false;
    }
  });
};

export default initWorkers;
