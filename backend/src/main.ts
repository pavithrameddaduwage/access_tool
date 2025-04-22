import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
// app.enableCors({
//   origin: true,
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: 'Content-Type,Authorization',
//   exposedHeaders: 'Content-Range,X-Content-Range'
// });  
app.enableCors();
app.useGlobalPipes(new ValidationPipe());
  // await app.listen(process.env.PORT ?? 3000); //change this to 3000 later
  await app.listen(process.env.PORT ?? 4006)
}
bootstrap();
