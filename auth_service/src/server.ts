import { app } from "./app";
import { config } from "./config";
import { validateConfig } from "./config/config";
import { redisClient } from "./infrastructure/cache/redis.client";
import { db } from "./infrastructure/database/client";
import logger from "./shared/logger";
import { serverHealthGauge, trackError } from "./shared/metrics";

const PORT = config.server.port;

const startServer = async () => {
  const startTime = process.hrtime();
  logger.info(`Starting ${config.env} server on port ${PORT}...`);
  try {


    const validatedConfig = validateConfig(); 
    logger.info(`Starting ${validatedConfig.env} server...`);

    
    await redisClient.getClient().ping();
    logger.info('Redis connection established successfully');

    // postgre health check.
    const dbHealthy = await db.query('SELECT 1');
    if (dbHealthy.rowCount === 1) {
      logger.info('PostgreSQL connection healthy');
    }


    const server = app.listen(PORT, () => {
      const duration = process.hrtime(startTime);
      const seconds = duration[0] + duration[1] / 1e9;

      logger.info(`Server is running in ${config.env} mode on port ${PORT}`, {
        startupDuration: seconds.toFixed(3),
      });

      serverHealthGauge.set(1);
    });


    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal} - shutting down gracefully...`);

      const shutdownStart = process.hrtime();

      try {

        await new Promise<void>((resolve) => server.close(() => resolve()));
        logger.info('HTTP server closed');

        // Disconnecting Redis
        await redisClient.disconnect();
        logger.info('Redis disconnected');
        const shutdownDuration = process.hrtime(shutdownStart);
        const seconds = shutdownDuration[0] + shutdownDuration[1] / 1e9;

        logger.info('Graceful shutdown complete', { duration: seconds.toFixed(3) });
        process.exit(0);
      } catch (err) {
        trackError('graceful_shutdown_failed', 'system', 'critical');
        logger.error('Graceful shutdown failed', err);
        process.exit(1);
      }
    };


    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      trackError('unhandled_promise_rejection', 'process', 'critical');
      logger.error('Unhandled Promise Rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
      trackError('uncaught_exception', 'process', 'critical');
      logger.error('Uncaught Exception', error);
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    trackError('server_startup_failed', 'system', 'critical');
    logger.error('Server startup failed', error);
    process.exit(1);
  }
};

startServer().catch((err) => {
  if (err instanceof Error) {
    logger.error("Server error occurred:", {
      message: err.message,
      name: err.name,
    });
  }

  process.exit(1);
});
