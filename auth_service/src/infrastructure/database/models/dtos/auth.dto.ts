
/**
 * DTO for user registration
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

/**
 * DTO for user login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * DTO for token refresh
 */
export interface RefreshTokenRequestDTO {
  refresh_token: string;
}

/**
 * DTO for logout
 */
export interface LogoutRequestDTO {
  refresh_token: string;
}

/**
 * DTO for password change
 */
export interface ChangePasswordRequestDTO {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * DTO for password reset request
 */
export interface RequestPasswordResetDTO {
  email: string;
}

/**
 * DTO for password reset completion
 */
export interface ResetPasswordDTO {
  token: string;
  new_password: string;
  confirm_password: string;
}

/**
 * DTO for email verification
 */
export interface VerifyEmailDTO {
  token: string;
}

/**
 * DTO for updating user profile
 */
export interface UpdateProfileDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
}