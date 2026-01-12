import redisClient from "../config/redis";
import URL, { IURL } from "../models/URL";
import { IURLRepository } from "./IURLRepository";
import logger from "../utils/logger";
import { measureDatabaseQuery } from "../utils/metrics";

export class URLRepository implements IURLRepository {
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = "URL:";

  private getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}:${id}`;
  }

  private getSearchCacheKey(query: any, skip: number, limit: number): string {
    return `${this.CACHE_PREFIX}:search:${JSON.stringify({
      query,
      skip,
      limit,
    })}`;
  }

  private async invalidateSearchCaches(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}:search:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info("Invalidated URL search caches", {
          count: keys.length,
        });
      }
    } catch (error) {
      logger.error("Failed to invalidate search caches", { error });
    }
  }

  async getALLURL(
    query: Partial<IURL>,
    skip: number,
    limit: number
  ): Promise<IURL[] | null> {
    const cacheKey = this.getSearchCacheKey(query, skip, limit);

    try {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        logger.debug("URL search cache hit", { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("Cache read failed, proceeding with database query", {
        error,
      });
    }
    

    const url = await measureDatabaseQuery("fetch_all_URL", () =>
      URL.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec()
    );

    try {
      await redisClient.set(
        cacheKey,
        JSON.stringify(url),
        "EX",
        this.CACHE_TTL
      );
    } catch (error) {
      logger.warn("Cache write failed", { error, cacheKey });
    }

    return url;
  }


  /**
   * @description Get single URL method
   * @param URLId
   * @returns
   */
  async getSingleURL(URLId: string): Promise<IURL | null> {
    const cacheKey = this.getCacheKey(URLId);

    try {
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        logger.debug("URL cache hit", { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("Cache read failed, proceeding with database query", {
        error,
      });
    }

    const URL = await measureDatabaseQuery("fetch_single_URL", () =>
      URL.findById(URLId).lean().exec()
    );

    if (URL) {
      try {
        await redisClient.set(
          cacheKey,
          JSON.stringify(URL),
          "EX",
          this.CACHE_TTL
        );
      } catch (error) {
        logger.warn("Cache write failed", { error, cacheKey });
      }
    }

    return URL;
  }

  /**
   * @description Update URL method
   * @param data
   * @param URLId
   * @returns
   */
  async updateURL(
    data: Partial<IURL>,
    URLId: string
  ): Promise<IURL | null> {
    const url = await URL.findByIdAndUpdate(
      URLId,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();

    if (url) {
      const cacheKey = this.getCacheKey(URLId);

      try {
        await Promise.all([
          redisClient.del(cacheKey),
          this.invalidateSearchCaches(),
        ]);

        logger.info("url cache invalidated", { URLId });
      } catch (error) {
        logger.error("Cache invalidation failed", { error, URLId });
      }
    }

    return url;
  }
  /**
   * @description Delete url method
   * @param data
   */
  async deleteURL(data: string): Promise<void> {
    await URL.findByIdAndDelete(data).exec();

    const cacheKey = this.getCacheKey(data);

    try {
      await Promise.all([
        redisClient.del(cacheKey),
        this.invalidateSearchCaches(),
      ]);

      logger.info("URL deleted and cache invalidated", {
        URLId: data,
      });
    } catch (error) {
      logger.error("Cache invalidation failed after deletion", {
        error,
        URLId: data,
      });
    }
  }
  /**
   * @description Create URL method
   * @param data
   * @param session
   * @returns
   */
  async createURL(
    data: Partial<IURL>
  ): Promise<IURL> {
    try {
      const [url] = await URL.create([data];

      logger.info("url created successfully", {
        storeId: url._id,
      });

      await this.invalidateSearchCaches();

      return url;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      logger.error("Failed to create URL", {
        error: errorMessage,
        data: { name: data.productId },
      });

      throw error instanceof Error
        ? error
        : new Error("Failed to create URL");
    }
  }
}
