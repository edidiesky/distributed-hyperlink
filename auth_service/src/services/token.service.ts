
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { redisClient } from '../infrastructure/cache/redis.client';
import { TokenPair } from '../infrastructure/database/models/dtos/auth-response.dto';
import { JWTPayload } from '../infrastructure/database/models/dtos/internal.dto';
import { AppError } from '../shared/errors/AppError';


export class TokenService {
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private secret: string;

  constructor() {
    this.accessTokenExpiry = config.jwt.accessExpiry;
    this.refreshTokenExpiry = config.jwt.refreshExpiry; 
    this.secret = config.jwt.secret;
  }

  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = this.generateRefreshToken(userId, email);
    const refreshExpSeconds = this.parseExpiry(this.refreshTokenExpiry);
    await redisClient.storeRefreshToken(userId, refreshToken, refreshExpSeconds);

    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, this.secret, {
      expiresIn:this.accessTokenExpiry as jwt.SignOptions['expiresIn'],
    });
  }

  private generateRefreshToken(userId: string, email: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      type: 'refresh',
    };

    return jwt.sign(payload, this.secret, {
      expiresIn:this.refreshTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: 'auth-service',
      audience: 'hyperlink-api',
    });
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    // Check if blacklisted
    const isBlacklisted = await redisClient.isAccessTokenBlacklisted(token);
    if (isBlacklisted) {
      throw AppError.badRequest('Token has been revoked');
    }

    try {
      const payload = jwt.verify(token, this.secret, {
        issuer: 'auth-service',
        audience: 'hyperlink-api',
      }) as JWTPayload;

      if (payload.type !== 'access') {
        throw AppError.badRequest('Invalid token type');
      }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw AppError.badRequest('Token expired');
      }
      throw AppError.badRequest('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, this.secret, {
        issuer: 'auth-service',
        audience: 'hyperlink-api',
      }) as JWTPayload;

      if (payload.type !== 'refresh') {
        throw AppError.badRequest('Invalid token type');
      }

      // Verify token exists in Redis
      const isValid = await redisClient.validateRefreshToken(payload.userId, token);
      if (!isValid) {
        throw AppError.badRequest('Refresh token has been revoked');
      }

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw AppError.badRequest('Refresh token expired');
      }
      throw AppError.badRequest('Invalid refresh token');
    }
  }

  async revokeToken(userId: string, token: string): Promise<void> {
    await redisClient.revokeRefreshToken(userId, token);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await redisClient.revokeAllUserTokens(userId);
  }

  async blacklistAccessToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      const expirySeconds = decoded.exp - Math.floor(Date.now() / 1000);
      if (expirySeconds > 0) {
        await redisClient.blacklistAccessToken(token, expirySeconds);
      }
    }
  }

  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}