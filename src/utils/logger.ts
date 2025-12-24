import chalk from "chalk";

const getTimeStamp = () =>
  new Date().toLocaleTimeString("en-GB", { hour12: false });

const logFormatted = (
  level: string,
  color: (text: string) => string,
  message: string,
  showInfo: boolean | string
) => {
  // If showInfo is strictly false, just print the clean message
  if (showInfo === false) {
    console.log(color(message));
    return;
  }

  const time = `[${getTimeStamp()}]`;
  const levelTag = `[ ${level} ]`;
  const separator = chalk.gray("─".repeat(80));

  if (typeof showInfo === "string") {
    // Header-style log with separators and metadata
    console.log(separator);
    console.log(`${chalk.gray(time)} ${color(levelTag)} ${message}`);
    console.log(separator);
  } else {
    // This handles cases where showInfo might be true (but not a string)
    // or fallback logic for standard tagged logs
    console.log(`${chalk.gray(time)} ${color(levelTag)} ${message}`);
  }
};

export const logger = {
  success: (message: string, showInfo = false as boolean | string) =>
    logFormatted("OK", chalk.green, message, showInfo),

  error: (message: string, showInfo = false as boolean | string) =>
    logFormatted("ERROR", chalk.red, message, showInfo),

  warning: (message: string, showInfo = false as boolean | string) =>
    logFormatted("WARN", chalk.yellow, message, showInfo),

  info: (message: string, showInfo = false as boolean | string) =>
    logFormatted("INFO", chalk.cyan, message, showInfo),

  debug: (message: string, showInfo = false as boolean | string) =>
    logFormatted("DEBUG", chalk.magenta, message, showInfo),

  simple: (message: string) => console.log(chalk.green(message)),
};
