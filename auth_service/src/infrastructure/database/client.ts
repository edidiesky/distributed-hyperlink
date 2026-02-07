import { Pool } from 'pg';
import { config } from '../../config';
import logger from '../../shared/logger'; 

export const db = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  query_timeout: 8000,
  statement_timeout: 5000,
  application_name: 'auth-service',
});

db.on('error', (err, client) => {
  logger.error('Unexpected error on idle PostgreSQL client', {
    error: err.message,
    stack: err.stack,
  });
});

(async () => {
  try {
    const client = await db.connect();
    logger.info('PostgreSQL connection pool initialized successfully');
    client.release();
  } catch (err) {
    logger.error('Failed to initialize PostgreSQL connection pool', err);
    process.exit(1);
  }
})();