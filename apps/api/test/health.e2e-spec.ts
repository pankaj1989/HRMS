import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        uptime: expect.any(Number),
        version: expect.any(String),
        timestamp: expect.any(String),
      }),
    );
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('GET /health/liveness returns 200 with { status: ok }', async () => {
    const response = await request(app.getHttpServer()).get('/health/liveness');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
