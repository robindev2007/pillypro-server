import { prisma } from "@/lib/db";
import * as cron from "node-cron";
import { logger } from "./logger";

/**
 * Clean up expired tokens from database
 * This removes tokens that have already expired from the ExpiredTokens table
 * Runs asynchronously without blocking requests
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const result = await prisma.expiredTokens.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info(`🧹 Cleaned up ${result.count} expired tokens from database`);
    }
  } catch (error) {
    logger.error(`❌ Error cleaning up expired tokens: ${error}`);
  }
};

/**
 * Clean up expired OTPs from database
 * Runs asynchronously without blocking requests
 */
export const cleanupExpiredOTPs = async (): Promise<void> => {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          {
            isRevoked: true,
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // older than 24 hours
            },
          },
        ],
      },
    });

    if (result.count > 0) {
      logger.info(`🧹 Cleaned up ${result.count} expired OTPs from database`);
    }
  } catch (error) {
    logger.error(`❌ Error cleaning up expired OTPs: ${error}`);
  }
};

/**
 * Run cleanup task (both tokens and OTPs)
 * This is async and won't block the event loop
 */
const runCleanupTask = async (): Promise<void> => {
  const startTime = Date.now();

  try {
    logger.info("🧹 Starting scheduled cleanup task...");
    const result = await Promise.all([
      cleanupExpiredTokens(),
      cleanupExpiredOTPs(),
    ]);

    const duration = Date.now() - startTime;
    logger.info(`✅ Cleanup task completed in ${duration}ms`);

    // Alert if cleanup takes too long
    if (duration > 5000) {
      logger.warning(`⚠️ Cleanup took ${duration}ms - consider optimization`);
    }
  } catch (error) {
    logger.error(`❌ Cleanup task failed: ${error}`);
  }
};

/**
 * Start periodic cleanup job using node-cron
 * Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 * This runs in the background and doesn't block requests
 */
export const startTokenCleanupJob = (): cron.ScheduledTask => {
  // Schedule cleanup to run every hour at minute 0
  const task = cron.schedule("0 * * * *", async () => {
    await runCleanupTask();
  });

  logger.info(
    "🧹 Token cleanup cron job scheduled (runs every hour at minute 0)"
  );

  // Run once after 5 minutes of startup
  setTimeout(() => {
    logger.info("🧹 Running initial cleanup task...");
    runCleanupTask();
  }, 5 * 60 * 1000);

  return task;
};

/**
 * Manual cleanup endpoint (for testing or manual trigger)
 * Can be exposed via API endpoint for admin users
 */
export const manualCleanup = async (): Promise<{
  tokensDeleted: number;
  otpsDeleted: number;
}> => {
  const tokensResult = await prisma.expiredTokens.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  const otpsResult = await prisma.oTP.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          isRevoked: true,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
  });

  return {
    tokensDeleted: tokensResult.count,
    otpsDeleted: otpsResult.count,
  };
};
