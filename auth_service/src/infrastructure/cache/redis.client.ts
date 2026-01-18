import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../../shared/logger";
dotenv.config();

const IO_REDIS_URL = process.env.IO_REDIS_URL || "redis://localhost:6379";

class RedisClient {
  private client;
  private isConnected: boolean = false;
  constructor() {
    this.client = new Redis(IO_REDIS_URL, {
      retryStrategy(times) {
        const delay = Math.min(times * 500, 2000);
        logger.error(`Retrying Redis connection (${times})...`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on("error", (err) => {
      this.isConnected = false;
      logger.error("Redis Client Error:", err.message);
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Successfully connected to Redis at", IO_REDIS_URL);
    });
  }

  async connect() {
    if(!this.isConnected) {
      await this.connect()
      logger.info("Redis has been connected!")

    }
  }

  async disconnect() {
    if(this.isConnected) {
      await this.client.quit()
      logger.info("Redis has been disconnected!")
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
    logger.info('Refresh token revoked', { userId });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(keys);
      logger.info('All user tokens revoked', { userId, count: keys.length });
    }
  }

  async blacklistAccessToken(token: string, expirySeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.client.setex(key, expirySeconds, '1');
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  getClient() {
    return this.client;
  }
}

export const redisClient = new RedisClient();
