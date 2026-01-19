
import bcrypt from 'bcrypt';
import logger from '../shared/logger';
import { LoginRequestDTO } from '../infrastructure/database/models/dtos/auth.dto';
import { CreateUserInternalDTO } from '../infrastructure/database/models/dtos/internal.dto';
import { UserRepository } from '../repository/auth.repository';
import { User } from '../infrastructure/database/models/user.model';
import { TokenPair } from '../infrastructure/database/models/dtos/auth-response.dto';
import { TokenService } from './token.service';
import { AppError } from '../shared/errors/AppError';

export class AuthService {
  private userRepo: UserRepository;
  private tokenService: TokenService;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.userRepo = new UserRepository();
    this.tokenService = new TokenService();
  }
  

  async register(userData: CreateUserInternalDTO): Promise<{ user: Partial<User>; tokens: TokenPair }> {

    if (!this.isValidEmail(userData.email)) {
      throw AppError.badRequest('Invalid email format');
    }
    if (userData.password.length < 8) {
      throw AppError.badRequest('Password must be at least 8 characters');
    }

    // Check exiting user
    const existing = await this.userRepo.findByEmail(userData.email);
    if (existing) {
      throw AppError.conflict('Email already registered', { email: userData.email });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Create user
    const user = await this.userRepo.create({
      ...userData,
      password_hash: passwordHash,
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async login(credentials: LoginRequestDTO): Promise<{ user: Partial<User>; tokens: TokenPair }> {
    const user = await this.userRepo.findByEmail(credentials.email);

    if (!user) {
      throw AppError.unauthenticated('Invalid credentials');
    }

    if (!user.is_active) {
      throw AppError.unauthorized('Account is deactivated');
    }

    const isValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValid) {
      logger.warn('Failed login attempt', { email: credentials.email });
      throw AppError.unauthenticated('Invalid credentials');
    }

    await this.userRepo.updateLastLogin(user.id);

    // Generate new tokens 
    const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

    logger.info('User logged in successfully', { userId: user.id, email: credentials.email });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);


    const user = await this.userRepo.findById(payload.userId);
    
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }
    await this.tokenService.revokeToken(payload.userId, refreshToken);

    const tokens = await this.tokenService.generateTokenPair(user.id, user.email);

    logger.info('Tokens refreshed', { userId: user.id });
    return tokens;
  }

  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Blacklist access token
    await this.tokenService.blacklistAccessToken(accessToken);
    // Revoke refresh token
    await this.tokenService.revokeToken(userId, refreshToken);

    logger.info('User logged out', { userId });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);

    logger.info('User logged out from all devices', { userId });
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    const payload = await this.tokenService.verifyAccessToken(token);
    return { userId: payload.userId, email: payload.email };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

