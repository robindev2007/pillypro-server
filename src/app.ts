// app.ts
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import env from "./config/env";
import httpStatus from "./constant/httpStatus";
import { prisma } from "./lib/db";
import { attachUser } from "./middleware/auth.middleware";
import errorMiddleware from "./middleware/error.middleware";
import fancyLogger from "./middleware/logger.middleware";
import routes from "./routes";

const app = express();

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

// 5. Routes
app.get("/", async (req, res) => {
  const data = await prisma.user.findMany();

  res.json({
    status: "success",
    message: "Welcome to the LIPBROW_LASH API",
    data,
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
