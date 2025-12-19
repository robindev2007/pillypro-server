import env from "@/config/env";
import AppError from "@/helpers/AppError";
import handleZodError from "@/helpers/zod.errors";
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import chalk from "chalk";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

const isDev = env.NODE_ENV === "development";

export const getTimeStamp = () => {
  const now = new Date();
  return now.toTimeString().split(" ")[0]; // HH:MM:SS
};

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const time = getTimeStamp();
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorDetails: Record<string, any> = {};
  let data: Record<string, any> = {};

  // Handle AppError first (custom application errors with data)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    data = err.data || {};

    // Add stack trace only in development
    if (isDev) {
      errorDetails = { stack: err.stack };
    }
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode || 400;
    message = simplifiedError?.message || "Validation failed";
    errorDetails = simplifiedError?.errorDetails || {};
  }
  // Handle Prisma unique constraint violation (P2002)
  else if (err?.code === "P2002") {
    statusCode = 409;
    const field = err.meta?.target?.join(", ") || "field";
    message = `A record with this ${field} already exists. Please use a different value.`;
    data = {
      conflictField: err.meta?.target,
      conflictType: "unique_constraint",
    };
    if (isDev) {
      errorDetails = { code: err.code, meta: err.meta };
    }
  }
  // Handle Prisma foreign key constraint violation (P2003)
  else if (err?.code === "P2003") {
    statusCode = 400;
    const field = err.meta?.field_name || "reference";
    message = `Invalid ${field}. The referenced record does not exist.`;
    data = {
      invalidField: err.meta?.field_name,
      constraintType: "foreign_key",
    };
    if (isDev) {
      errorDetails = { code: err.code, meta: err.meta };
    }
  }
  // Handle Prisma null constraint violation (P2011)
  else if (err?.code === "P2011") {
    statusCode = 400;
    const field = err.meta?.field_name || "field";
    message = `${field} is required and cannot be empty.`;
    data = {
      missingField: err.meta?.field_name,
      constraintType: "not_null",
    };
    if (isDev) {
      errorDetails = { code: err.code, meta: err.meta };
    }
  }
  // Handle Prisma record not found (P2025)
  else if (err?.code === "P2025") {
    statusCode = 404;
    message = `The requested record was not found. ${
      err.meta?.cause || ""
    }`.trim();
    data = { recordNotFound: true };
    if (isDev) {
      errorDetails = { code: err.code, cause: err.meta?.cause };
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data format. Please check your input.";
    if (isDev) {
      errorDetails = { prismaError: err.message };
    }
  }
  // Handle Prisma known request errors
  else if (err instanceof PrismaClientKnownRequestError) {
    statusCode = 400;
    message = "Database operation failed. Please verify your request.";
    data = { errorCode: err.code };
    if (isDev) {
      errorDetails = { code: err.code, meta: err.meta, message: err.message };
    }
  }
  // Handle Prisma unknown request errors
  else if (err instanceof PrismaClientUnknownRequestError) {
    statusCode = 500;
    message = "An unexpected database error occurred. Please try again.";
    if (isDev) {
      errorDetails = { error: err.message };
    }
  }
  // Handle JSON parse errors
  else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON format in request body.";
    data = {
      parseError: true,
      hint: "Check for missing quotes, commas, or invalid characters",
    };
    if (isDev) {
      errorDetails = {
        body: err.body,
        providedBody: req.body,
      };
    }
  }
  // Handle JWT token expired errors
  else if (err instanceof Error && err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
    data = {
      tokenExpired: true,
      signOut: true,
      accessTokenExpired: true,
    };
    if (isDev) {
      errorDetails = { stack: err.stack };
    }
  }
  // Handle JWT invalid token errors
  else if (err instanceof Error && err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
    data = {
      tokenInvalid: true,
      signOut: true,
    };
    if (isDev) {
      errorDetails = { error: err.message, stack: err.stack };
    }
  }
  // Handle generic errors
  else if (err instanceof Error) {
    statusCode = (err as any)?.statusCode || 500;
    message = err.message || "An unexpected error occurred.";
    if (isDev) {
      errorDetails = {
        name: err.name,
        stack: err.stack,
      };
    }
  }
  // Handle unknown error types
  else {
    statusCode = 500;
    message = "An unexpected error occurred. Please try again.";
    if (isDev) {
      errorDetails = {
        error: String(err),
        type: typeof err,
      };
    }
  }

  // Build response object
  const response: Record<string, any> = {
    success: false,
    statusCode,
    message,
  };

  // Add data if present
  if (Object.keys(data).length > 0) {
    response.data = data;
  }

  // Add error details in development mode
  if (isDev && Object.keys(errorDetails).length > 0) {
    response.errorDetails = errorDetails;
    response.requestBody = req.body;
    response.requestPath = req.path;
    response.requestMethod = req.method;
  }

  // Send response
  res.status(statusCode).json(response);

  // Determine log type for colors
  let logType: "success" | "warning" | "error" | "info" = "info";
  if (statusCode >= 500) logType = "error";
  else if (statusCode >= 400) logType = "warning";
  else if (statusCode >= 300) logType = "info";
  else if (statusCode >= 200) logType = "success";

  // Log detailed error info
  const formattedDetails = { ...errorDetails };
  if (formattedDetails.stack) {
    formattedDetails.stack = formattedDetails.stack.split("\n").join("\n"); // just to emphasize
  }

  console.log(chalk.red(JSON.stringify(formattedDetails, null, 2)));
};

export default errorMiddleware;
