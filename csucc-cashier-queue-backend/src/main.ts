import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ["GET", "POST"],
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(5000);
}
bootstrap();
