import logger from "../utils/logger";
import {
  BASE_DELAY_MS,
  EXPIRATION_SEC,
  JITTER,
  MAX_RETRIES,
  URL_ONBOARDING_COMPLETED_TOPIC,
} from "../constants";
import redisClient from "../config/redis";
export const urlTopic = {
  [URL_ONBOARDING_COMPLETED_TOPIC]: async (data: any) => {
    const {
      URLId,
      storeId,
      ownerId,
      sku,
      title,
      image,
      availableStock,
      thresholdStock,
      ownerName,
      idempotencyId,
    } = data;
    logger.info("url Onboarding data:", data);
    const requestId = idempotencyId || `${ownerId}-${URLId}`;
    const idempKey = `url-onboard-${requestId}`;
    const is_locked = await redisClient.setnx(idempKey, "locked");
    if (!is_locked) {
      logger.warn("Duplicate url onboarding request detected", {
        requestId,
        ownerId,
        URLId,
      });
      return;
    }

    await redisClient.expire(idempKey, EXPIRATION_SEC / 1000);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const url = await urlService.createurl(ownerId, {
          URLId,
          ownerId,
          urlId: url._id,
          requestId,
        });
        return;
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`url creation failed (attempt ${attempt + 1})`, {
            ownerId,
            error: error.message,
            stack: error.stack,
          });
        }
        if (attempt === MAX_RETRIES - 1) {
          logger.error("ALL RETRIES FAILED, Sending rollback", { ownerId });
          // await sendurlMessage(url_CREATION_FAILED_TOPIC, data);
        } else {
          const delay = Math.pow(2, attempt) * BASE_DELAY_MS + JITTER;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
  },
};
