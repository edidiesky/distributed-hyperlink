import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../../shared/logger";
dotenv.config();

const IO_REDIS_URL = process.env.IO_REDIS_URL || "redis://localhost:6379";

class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;
  
  constructor() {
    this.client = new Redis(IO_REDIS_URL, {
      retryStrategy(times) {
        if (times > 10) {
          logger.error(`Max Redis retry attempts (${times}) reached`);
          return null; // Stop retrying after 10 attempts
        }
        const delay = Math.min(times * 500, 2000);
        logger.error(`Retrying Redis connection (${times})...`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false, // Auto-connect on instantiation
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
      logger.error("Redis Client Error:", err.message);
    });

    this.client.on("connect", () => {
      logger.info("Redis connection established");
    });

    this.client.on("ready", () => {
      this.isConnected = true;
      logger.info("Successfully connected to Redis at", IO_REDIS_URL);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      logger.warn("Redis connection closed");
    });

    this.client.on("reconnecting", () => {
      logger.info("Attempting to reconnect to Redis...");
    });
  }

  async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const startTime = Date.now();
    
    while (!this.isConnected && Date.now() - startTime < timeoutMs) {
      try {
        await this.client.ping();
        this.isConnected = true;
        logger.info("Redis connection verified via ping");
        return;
      } catch (error) {
        logger.debug("Waiting for Redis connection...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!this.isConnected) {
      throw new Error(`Redis connection timeout after ${timeoutMs}ms`);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis has been disconnected!");
    }
  }

  async storeRefreshToken(userId: string, token: string, expirySeconds: number): Promise<void> {
    const key = `refresh_token:${userId}:${token}`;
    await this.client.setex(key, expirySeconds, token);
    logger.debug('Refresh token stored', { userId, expiresIn: expirySeconds });
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const key = `refresh_token:${userId}:${token}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const key = `refresh_token:${userId}:${token}`;
    await this.client.del(key);
    logger.info('Refresh token has just been revoked', { userId });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(keys);
      logger.info('All user tokens has been revoked', { userId, count: keys.length });
    }
  }

  async blacklistAccessToken(token: string, expirySeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.setex(key, expirySeconds, '1');
    logger.info("The access token has been blacklisted!");
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  getClient() {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const redisClient = new RedisClient();