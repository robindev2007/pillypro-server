import chalk from "chalk";
import os from "os";
import app from "./app";
import env from "./config/env";
import { seedSuperAdmin } from "./lib/db/seedAdmin";
import { logger } from "./utils/logger";
import { startTokenCleanupJob } from "./utils/tokenCleanup";

const port = env.PORT || 5000;

const getLocalIp = (): string => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "127.0.0.1";
};

export const startUpLogger = async () => {
  const localIp = getLocalIp();
  logger.info(`🚀 Starting Project...\n`);
  logger.info(`📝 Project Name   : ${env.PROJECT_NAME || "N/A"}`);
  logger.info(`💻 Local URL      : http://localhost:${port}`);
  logger.info(`🌍 Server URL     : http://${localIp}:${port}`);
  logger.info(`📚 OpenApi Dock   : http://${localIp}:${port}/openapi`);
  logger.success(`✅ Server Status  : ONLINE`);
  logger.info(`🛠️  Environment    : ${env.NODE_ENV.toUpperCase()}\n`);
  logger.success(`🎉 Project Started Successfully!\n`);
};

async function main() {
  // Seed super admin on startup

  const server = app.listen(port, () => {
    startUpLogger();
  });

  seedSuperAdmin();

  // Start token cleanup job
  const cleanupJob = startTokenCleanupJob();

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.error("Server closed!");
      });
    }
    // Stop cron job
    if (cleanupJob) {
      cleanupJob.stop();
      logger.info("🧹 Cleanup job stopped");
    }
    process.exit(1);
  };

  process.on("uncaughtException", (error) => {
    logger.error("❌ Uncaught Exception ❌");
    logger.error(chalk.red(error));
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    logger.error("❌ Unhandled Rejection ❌");
    console.error(chalk.red(error));
    exitHandler();
  });
}

main();
