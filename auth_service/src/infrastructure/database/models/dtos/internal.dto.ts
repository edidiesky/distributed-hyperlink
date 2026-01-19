export interface CreateUserInternalDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Decoded token with user info
 */
export interface DecodedToken {
  user_id: string;
  email: string;
  token_type: 'access' | 'refresh';
}

/**
 * Session information
 */
export interface SessionInfo {
  user_id: string;
  device_info?: {
    user_agent: string;
    ip_address: string;
    device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  };
  created_at: Date;
  expires_at: Date;
}
