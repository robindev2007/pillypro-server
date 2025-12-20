import chalk from "chalk";
import os from "os";
import app from "./app";
import { setupWebSocket } from "./app/ws/ws.route";
import env from "./config/env";
import { seedSuperAdmin } from "./lib/db/seedAdmin";
import { logger } from "./utils/logger";
import { startTokenCleanupJob } from "./utils/tokenCleanup";

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

export const startUpLogger = async (port: number) => {
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

async function startServer(port: number = env.PORT || 5000) {
  const server = app.listen(port);

  server.once("listening", () => {
    // ✅ This runs ONLY when the port is free
    startUpLogger(port);

    setupWebSocket(server);
    seedSuperAdmin();

    const cleanupJob = startTokenCleanupJob();

    const exitHandler = () => {
      server.close(() => {
        logger.error("Server closed!");
      });

      cleanupJob?.stop();
      logger.info("🧹 Cleanup job stopped");

      process.exit(1);
    };

    process.on("uncaughtException", (error: any) => {
      if (error?.code === "EADDRINUSE") return;
      logger.error("❌ Uncaught Exception ❌");
      logger.error(chalk.red(error));
      exitHandler();
    });

    process.on("unhandledRejection", (error) => {
      logger.error("❌ Unhandled Rejection ❌");
      console.error(chalk.red(error));
      exitHandler();
    });
  });

  server.once("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      logger.error(
        chalk.red(`❌ Port ${port} is already in use. Trying ${port + 1}...`)
      );

      server.close();
      startServer(port + 1);
      return;
    }

    logger.error("❌ Server error ❌");
    logger.error(err);
    process.exit(1);
  });
}

startServer();
