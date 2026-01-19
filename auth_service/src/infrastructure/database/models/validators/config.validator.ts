import Joi from "joi";

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),

  // Database (Citus coordinator)
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5433),
  DATABASE_NAME: Joi.string().default("citus_dev"),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().min(8).required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRY: Joi.string().default("7d"),

  // Server
  PORT: Joi.number().default(4001),
  API_PREFIX: Joi.string().default("/api/v1"),
  WEB_ORIGIN: Joi.string().uri().required(),
}).unknown();
