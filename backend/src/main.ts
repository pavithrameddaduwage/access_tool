import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { createServer } from 'net';

import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;

  while (!(await isPortAvailable(port))) {
    port += 1;
  }

  return port;
}

async function bootstrap() {
  process.env.TZ = 'America/New_York';
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization, timezone',
    exposedHeaders: 'Content-Range,X-Content-Range',
  });
  app.useGlobalPipes(new ValidationPipe());

  const preferredPort = Number.parseInt(process.env.PORT ?? '4006', 10);
  const startingPort = Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : 4006;
  const port = await findAvailablePort(startingPort);

  if (port !== startingPort) {
    logger.warn(`Port ${startingPort} is in use. Starting the backend on port ${port} instead.`);
  }

  await app.listen(port);
  logger.log(`Backend is listening on port ${port}`);
}
bootstrap();
