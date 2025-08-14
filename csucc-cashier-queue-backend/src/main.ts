import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ["GET", "POST"],
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(process.env.PORT || 5000);
}
bootstrap();
