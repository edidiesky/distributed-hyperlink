import { SafeUser } from "../user.model";
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface AuthResponseDTO {
  user: SafeUser;
  token: TokenPair;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponseDTO {
  tokens: TokenPair;
}

/**
 * Logout response
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * Token verification response
 */
export interface VerifyTokenResponseDTO {
  valid: boolean;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Generic success response
 */
export interface SuccessResponseDTO {
  message: string;
}

/**
 * Error response structure
 */
export interface ErrorResponseDTO {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: Date;
  path?: string;
}