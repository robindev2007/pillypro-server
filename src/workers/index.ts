import { prisma } from "@/lib/db";
import {
  MedicineHistoryStatus,
  MedicineType,
  SlotType,
} from "@/prisma/generated/enums";
import { logger } from "@/utils/logger";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import cron from "node-cron";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

let isRunning = false;
let count = 0;

export const seedStressTestData = async () => {
  const targetEmail = "1@gmail.com";

  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    logger.error(
      `User with email ${targetEmail} not found. Please create user first.`
    );
    return;
  }

  logger.info(`🚀 Starting stress-test seed for ${targetEmail}...`);

  // 2. Create 50 different Medicine Slots (High volume)
  // Each medicine will have 4 doses a day = 200 checks per 10 seconds
  const medicines = [
    "Aspirin",
    "Metformin",
    "Lisinopril",
    "Albuterol",
    "Gabapentin",
    "Omeprazole",
    "Losartan",
    "Sertraline",
    "Vitamin C",
    "Omega 3",
  ];

  for (let i = 0; i < 50; i++) {
    const medName = `${medicines[i % 10]} #${i}`;

    const slot = await prisma.medicineSlot.create({
      data: {
        userId: user.id,
        doseName: medName,
        medicineType: MedicineType.PILL,
        slotType: SlotType.MEDIUM,
        totalPills: 100,
        takenPills: 0,
        startDate: dayjs().subtract(1, "month").toDate(),
        endDate: dayjs().add(1, "year").toDate(),
        timezone: "Asia/Dhaka", // IANA format to avoid your previous error
        isActive: true,
        notificationEnabled: true,
        // 4 doses spread throughout the day
        medicineTimes: ["08:00 AM", "12:00 PM", "04:00 PM", "08:00 PM"],
      },
    });

    // 3. Create 30 days of history for each medicine (120 records per med)
    // This tests your database's ability to filter through history quickly
    const historyData = [] as any[];
    for (let day = 0; day < 30; day++) {
      const date = dayjs().subtract(day, "day");

      ["08:00 AM", "12:00 PM", "04:00 PM", "08:00 PM"].forEach((time) => {
        historyData.push({
          userId: user.id,
          slotId: slot.id,
          slotTime: time,
          status:
            Math.random() > 0.2
              ? MedicineHistoryStatus.TAKEN
              : MedicineHistoryStatus.MISSED,
          createdAt: date.toDate(),
          doseTakenAt: date.toDate(),
        });
      });
    }

    // Bulk insert history for this slot
    await prisma.medicineHistory.createMany({
      data: historyData,
    });
  }

  logger.info("✅ Stress-test data seeded successfully!");
  logger.info("Total Medicine Slots created: 50");
  logger.info("Total History Records created: 6,000");
};

const initWorkers = () => {
  logger.info("🛠️  Initializing Workers...");

  cron.schedule("*/10 * * * * *", async () => {
    if (isRunning) return logger.info("⏳ Previous job active, skipping...");

    isRunning = true;
    const startTime = Date.now();
    let missedCreatedCount = 0;
    let processedTimeSlots = 0;

    console.log("\n" + "=".repeat(60));
    logger.info(
      `🔍 CRON START [Run #${count++}] | Time: ${dayjs().format("HH:mm:ss")}`
    );
    console.log("-".repeat(60));

    try {
      const now = dayjs();
      const activeSlots = await prisma.medicineSlot.findMany({
        where: { isActive: true, endDate: { gte: now.toDate() } },
        include: { user: { select: { email: true, name: true } } }, // Join user for better logs
      });

      for (const slot of activeSlots) {
        let userTz = slot.timezone || "UTC";
        if (userTz.includes("GMT")) userTz = "UTC";

        for (const timeStr of slot.medicineTimes) {
          processedTimeSlots++;
          try {
            const scheduledToday = dayjs
              .tz(timeStr, "hh:mm A", userTz)
              .year(now.year())
              .month(now.month())
              .date(now.date());

            const missedThreshold = scheduledToday.add(4, "hour");

            if (now.isAfter(missedThreshold)) {
              // Exact match check
              const existingHistory = await prisma.medicineHistory.findFirst({
                where: {
                  slotId: slot.id,
                  slotTime: timeStr,
                  createdAt: {
                    gte: dayjs().startOf("day").toDate(),
                    lte: dayjs().endOf("day").toDate(),
                  },
                },
              });

              if (!existingHistory) {
                await prisma.medicineHistory.create({
                  data: {
                    userId: slot.userId,
                    slotId: slot.id,
                    status: "MISSED",
                    slotTime: timeStr,
                  },
                });

                missedCreatedCount++;
                // DETAILED LOGGING
                console.log(`❌ [MISSED DETECTED]`);
                console.log(`   👤 User: ${slot.user?.email || slot.userId}`);
                console.log(`   💊 Med:  ${slot.doseName}`);
                console.log(
                  `   ⏰ Time: ${timeStr} (Threshold: ${missedThreshold.format(
                    "HH:mm A"
                  )})`
                );
                console.log(`   🆔 ID:   ${slot.id}`);
                console.log("-".repeat(30));
              }
            }
          } catch (err: any) {
            logger.error(`Error processing slot ${slot.id}: ${err.message}`);
          }
        }
      }
    } catch (error) {
      logger.error("🔴 Cron Worker Critical Error:", error as any);
    } finally {
      const duration = Date.now() - startTime;
      console.log("-".repeat(60));
      logger.info(
        `✅ CRON END | Duration: ${duration}ms | Processed: ${processedTimeSlots} slots | Missed Created: ${missedCreatedCount}`
      );
      console.log("=".repeat(60) + "\n");
      isRunning = false;
    }
  });
};

export default initWorkers;
