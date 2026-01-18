import { envSchema } from "../infrastructure/database/models/validators/config.validator";
import logger from "../shared/logger";
import { Config } from "../shared/types";

export const validateConfig = (): Config => {
  const {error, value} = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true,
    errors: { label: "key" },
  });

  if(error) {
    logger.error("Configuration validation failed:");
    error.details.forEach((detail) => {
      logger.error(`- ${detail.message}`);
    });
    process.exit(1);
  }

  return {
    env: value.NODE_ENV,
    database: {
      host: value.DATABASE_HOST,
      port: value.DATABASE_PORT,
      name: value.DATABASE_NAME,
      user: value.DATABASE_USER,
      password: value.DATABASE_PASSWORD,
    },
    jwt: {
      secret: value.JWT_SECRET,
      accessExpiry: value.JWT_ACCESS_EXPIRY,
      refreshExpiry: value.JWT_REFRESH_EXPIRY,
    },
    server: {
      port: value.PORT,
      apiPrefix: value.API_PREFIX,
    },
  };
};


