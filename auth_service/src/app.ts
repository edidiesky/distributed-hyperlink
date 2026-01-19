import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import authRoute from "./route/auth.routes";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, NotFound } from "./shared/middleware/error-handler";
import { reqReplyTime, authRegistry } from "./shared/metrics";
import logger from "./shared/logger";
import { INTERNAL_SERVER_ERROR } from "./shared/constants";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.WEB_ORIGIN!
    ],
    credentials: true,
  })
);

/** LOGS REQUEST */
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// LATENCY METRICS MIDDLEWARE
app.use((req, res, next) => {
  const startTime = process.hrtime();
  res.on("finish", () => reqReplyTime(req, res, startTime));
  next();
});

/** HEALTH CHECK */
app.get("/health", (_req, res) => {
  res.json({ status: "Auth route is Fine!" });
});

/** ROUTES */
app.use("/api/v1/auth", authRoute);

/**
 * @description Metrics endpoint for my Prometheus server
 */
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", authRegistry.contentType);
    res.end(await authRegistry.metrics());
    logger.info("Auth Metrics has been scraped successfully!");
  } catch (error) {
    logger.error("Auth Metrics scraping error:", { error });
    res.status(INTERNAL_SERVER_ERROR).end();
  }
});

app.use(errorHandler);
app.use(NotFound);

export { app };