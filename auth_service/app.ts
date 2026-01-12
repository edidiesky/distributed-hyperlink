import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import urlRoute from "./routes/url.route";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, NotFound } from "./shared/middleware/error-handler";
import { reqReplyTime, UrlRegistry } from "./shared/metrics";
import logger from "./shared/logger";
import { SERVER_ERROR_STATUS_CODE } from "./shared/constants";

const app = express();

/** MIDDLEWARE */
if (!process.env.WEB_ORIGIN) {
  throw new Error("No WEB_ORIGIN");
}
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
  res.json({ status: "Authentication route is Fine!" });
});

/** ROUTES */
app.use("/api/v1/auth", urlRoute);

/**
 * @description Metrics endpoint for my Prometheus server
 */
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", UrlRegistry.contentType);
    res.end(await UrlRegistry.metrics());
    logger.info("Authentication Metrics has been scraped successfully!");
  } catch (error) {
    logger.error("Authentication Metrics scraping error:", { error });
    res.status(SERVER_ERROR_STATUS_CODE).end();
  }
});

app.use(errorHandler);
app.use(NotFound);

export { app };