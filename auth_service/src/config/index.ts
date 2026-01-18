import { validateConfig } from "./config";
const validated = validateConfig();

export const config = {
  env: validated.env,
  database: validated.database,
  jwt: validated.jwt,
  server: validated.server,
} as const;
Object.freeze(config);