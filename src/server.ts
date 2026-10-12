import { createApp } from './app';
import { env } from './config/environment.config';
import { initializeDatabase, AppDataSource } from './config/database.config';
import { logger } from './logging/logger';

async function bootstrap() {
  logger.info('Initializing Luxe E-Commerce backend service...', {
    environment: env.NODE_ENV,
    port: env.PORT,
  });

  const dbConnected = await initializeDatabase();
  if (!dbConnected) {
    logger.warn(
      'Database connection could not be established on startup. Ensure MySQL is running on port ' +
        env.DB_PORT +
        ' or run `docker compose up -d`.'
    );
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server successfully listening on http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully closing application...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        logger.info('Database connections closed.');
      }
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forcefully terminating process due to shutdown timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection:', { error: reason?.message || reason, stack: reason?.stack });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap failure:', { error: err.message, stack: err.stack });
  process.exit(1);
});
