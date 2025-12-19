// logger.ts
import chalk from "chalk";

// Utility to get current timestamp
const getTimeStamp = (): string =>
  new Date().toTimeString().split(" ")[0] as string;

// Centralized logger
type LoggerOptions = { type?: string };

export const logger = {
  success: (message: string) => console.log(chalk.green(message)),
  error: (message: string) => console.log(chalk.red(message)),
  warning: (message: string) => console.log(chalk.yellow(message)),
  info: (message: string) => console.log(chalk.cyan(message)),
  debug: (message: string) => console.log(chalk.magenta(message)),
};
