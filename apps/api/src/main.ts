import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ShutdownSignal } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
  });

  app.enableShutdownHooks([ShutdownSignal.SIGTERM, ShutdownSignal.SIGINT]);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`HRMS API listening on http://localhost:${port}`);
}

void bootstrap();
