import Joi from "joi";

/**
 * Password validation rules
 */
const passwordRules = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
  });

/**
 * Email validation rules
 */
const emailRules = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .messages({
    'string.email': 'Must be a valid email address',
    'string.max': 'Email must not exceed 255 characters',
  });

/**
 * Name validation rules
 */
const nameRules = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z\s'-]+$/)
  .trim()
  .messages({
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
  });

/**
 * Register validation schema
 */
export const registerValidation = Joi.object({
  email: emailRules.required(),
  password: passwordRules.required(),
  first_name: nameRules.required(),
  last_name: nameRules.required(),
});

/**
 * Login validation schema
 */
export const loginValidation = Joi.object({
  email: emailRules.required(),
  password: Joi.string().required(),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenValidation = Joi.object({
  refresh_token: Joi.string().required(),
});

/**
 * Logout validation schema
 */
export const logoutValidation = Joi.object({
  refresh_token: Joi.string().required(),
});

/**
 * Change password validation schema
 */
export const changePasswordValidation = Joi.object({
  current_password: Joi.string().required(),
  new_password: passwordRules.required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
});

/**
 * Request password reset validation schema
 */
export const requestPasswordResetValidation = Joi.object({
  email: emailRules.required(),
});

/**
 * Reset password validation schema
 */
export const resetPasswordValidation = Joi.object({
  token: Joi.string().required(),
  new_password: passwordRules.required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
    }),
});

/**
 * Update profile validation schema
 */
export const updateProfileValidation = Joi.object({
  first_name: nameRules.optional(),
  last_name: nameRules.optional(),
  email: emailRules.optional(),
}).min(1); 

/**
 * Verify email validation schema
 */
export const verifyEmailValidation = Joi.object({
  token: Joi.string().required(),
});