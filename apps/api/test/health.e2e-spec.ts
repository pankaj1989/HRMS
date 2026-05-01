import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface HealthResponse {
  status: string;
  uptime: number;
  version: string;
  timestamp: string;
}

interface LivenessResponse {
  status: string;
}

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with shape { status, uptime, version, timestamp }', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/health');
    const body = response.body as HealthResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.version).toBe('string');
    expect(typeof body.timestamp).toBe('string');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('GET /health/liveness returns 200 with { status: ok }', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/health/liveness');
    const body = response.body as LivenessResponse;
    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok' });
  });
});
