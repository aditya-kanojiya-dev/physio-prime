import { describe, it, expect } from 'vitest';
import request from 'supertest';
import '../src/lib/load-env';
import { createApp } from '../src/index';
import { parseAllowedOrigins } from '../src/lib/cors';

describe('parseAllowedOrigins', () => {
  it('always includes APP_URL origin and its www twin', () => {
    const allowed = parseAllowedOrigins({
      APP_URL: 'https://physio-prime.com',
      NODE_ENV: 'production',
    });
    expect(allowed.has('https://physio-prime.com')).toBe(true);
    expect(allowed.has('https://www.physio-prime.com')).toBe(true);
    expect(allowed.has('http://localhost:5173')).toBe(false);
  });

  it('merges CORS_ORIGINS and keeps localhost only outside production', () => {
    const allowed = parseAllowedOrigins({
      APP_URL: 'https://physio-prime.com/',
      CORS_ORIGINS: 'https://admin.physio-prime.com, https://staging.physio-prime.com/',
      NODE_ENV: 'development',
    });
    expect(allowed.has('https://admin.physio-prime.com')).toBe(true);
    expect(allowed.has('https://staging.physio-prime.com')).toBe(true);
    expect(allowed.has('http://localhost:5175')).toBe(true);
  });
});

describe('CORS', () => {
  const app = createApp();
  const allowedOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : 'http://localhost:5173';

  it('reflects an allowlisted Origin on credentialed requests', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', allowedOrigin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not reflect an unknown Origin', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests with no Origin (webhooks, curl, same-host proxy)', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('answers preflight only for allowlisted origins', async () => {
    const ok = await request(app)
      .options('/api/v1/health')
      .set('Origin', allowedOrigin)
      .set('Access-Control-Request-Method', 'GET');
    expect(ok.status).toBeLessThan(400);
    expect(ok.headers['access-control-allow-origin']).toBe(allowedOrigin);

    const blocked = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
