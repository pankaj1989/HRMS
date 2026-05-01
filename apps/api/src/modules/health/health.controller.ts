import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

const SERVICE_VERSION = process.env.SERVICE_VERSION ?? '0.0.0-dev';

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  getHealth(): {
    status: 'ok';
    uptime: number;
    version: string;
    timestamp: string;
  } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: SERVICE_VERSION,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
