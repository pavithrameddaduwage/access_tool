import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

const logger = new Logger('Bootstrap');

async function bootstrap() {
  process.env.TZ = 'America/New_York';

  const dbHost = process.env.PG_DB_HOST || 'localhost';
  const dbPort = process.env.PG_DB_PORT || '5432';
  const dbName = process.env.PG_DB_NAME || 'access_tool';

  logger.log(`Connecting to database → ${dbHost}:${dbPort}/${dbName} ...`);

  const app = await NestFactory.create(AppModule);

  // Check DB connection after app initialises
  try {
    const dataSource = app.get(DataSource);
    if (dataSource.isInitialized) {
      logger.log(`✅  Database connected  (${dbHost}:${dbPort}/${dbName})`);
    } else {
      logger.error(`❌  Database NOT connected  (${dbHost}:${dbPort}/${dbName})`);
    }
  } catch (err) {
    logger.error(`❌  Database connection check failed: ${err.message}`);
  }

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization, timezone',
    exposedHeaders: 'Content-Range,X-Content-Range',
  });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 4019);
  logger.log(`🚀  Server running on port ${process.env.PORT ?? 4019}`);
}
bootstrap();
