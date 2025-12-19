// fancyLogger.ts
import chalk from "chalk";
import { NextFunction, Request, Response } from "express";
import onFinished from "on-finished";

interface FancyLoggerOptions {
  logBody?: boolean;
}

const getTimeStamp = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const fancyLogger = (options: FancyLoggerOptions = {}) => {
  const { logBody = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const timestamp = getTimeStamp();

    // Separator line at the start
    console.log(chalk.gray("─".repeat(80)));

    // Linux boot-style log entry
    console.log(
      chalk.gray(`[${timestamp}]`) +
        chalk.green(" [  OK  ] ") +
        chalk.white(`Starting ${req.method} request to `) +
        chalk.cyan(req.originalUrl)
    );

    // Show auth status
    const authHeader = req.headers.authorization;
    if (authHeader) {
      console.log(
        chalk.gray(`[${timestamp}]`) +
          chalk.green(" [  OK  ] ") +
          chalk.white("Authentication token detected")
      );
    }

    // Log request body if enabled
    if (logBody && req.body && Object.keys(req.body).length > 0) {
      console.log(
        chalk.gray(`[${timestamp}]`) +
          chalk.blue(" [ INFO ] ") +
          chalk.white("Request payload:")
      );
      const bodyStr = JSON.stringify(req.body, null, 2);
      bodyStr.split("\n").forEach((line) => {
        console.log(chalk.gray("         ") + chalk.dim(line));
      });
    }

    // Log response info when finished
    onFinished(res, () => {
      const duration = Date.now() - start;
      const endTime = getTimeStamp();

      let statusType = chalk.green(" [  OK  ] ");
      let statusText = "completed successfully";

      if (res.statusCode >= 400 && res.statusCode < 500) {
        statusType = chalk.yellow(" [ WARN ] ");
        statusText = "completed with warnings";
      }
      if (res.statusCode >= 500) {
        statusType = chalk.red(" [ FAIL ] ");
        statusText = "failed with errors";
      }

      console.log(
        chalk.gray(`[${endTime}]`) +
          statusType +
          chalk.white(`Request ${statusText} `) +
          chalk.gray(`[`) +
          chalk.cyan(`${res.statusCode}`) +
          chalk.gray(`]`) +
          chalk.gray(` in ${duration}ms`)
      );
      // Separator line at the end
      console.log(chalk.gray("─".repeat(80)));
      console.log(""); // Empty line for spacing
    });

    next();
  };
};

export default fancyLogger;
