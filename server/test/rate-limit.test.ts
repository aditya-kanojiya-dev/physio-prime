import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { rateLimit } from 'express-rate-limit';
import { isRateLimitExempt } from '../src/lib/rate-limit';
import { trustProxyHops } from '../src/lib/trust-proxy';
import { createApp } from '../src/index';

describe('trustProxyHops', () => {
  it('defaults to one hop in production and off otherwise', () => {
    expect(trustProxyHops({ NODE_ENV: 'production' })).toBe(1);
    expect(trustProxyHops({ NODE_ENV: 'development' })).toBe(false);
    expect(trustProxyHops({ NODE_ENV: 'production', TRUST_PROXY: '0' })).toBe(false);
    expect(trustProxyHops({ NODE_ENV: 'development', TRUST_PROXY: '2' })).toBe(2);
  });
});

describe('isRateLimitExempt', () => {
  it('skips health checks and Razorpay webhooks only', () => {
    expect(isRateLimitExempt({ originalUrl: '/api/v1/health', path: '/api/v1/health' })).toBe(true);
    expect(isRateLimitExempt({ originalUrl: '/api/v1/razorpay/webhook', path: '/webhook' })).toBe(true);
    expect(isRateLimitExempt({ originalUrl: '/api/v1/auth/me', path: '/me' })).toBe(false);
  });
});

describe('rate limiting', () => {
  it('returns 429 with the API error shape after the limit', async () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        limit: 2,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } });
        },
      }),
    );
    app.get('/ping', (_req, res) => {
      res.json({ ok: true });
    });

    expect((await request(app).get('/ping')).status).toBe(200);
    expect((await request(app).get('/ping')).status).toBe(200);
    const blocked = await request(app).get('/ping');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: { message: 'Too many requests. Please try again later.' } });
  });

  it('does not rate-limit the health endpoint on the real app', async () => {
    const app = createApp();
    const results = await Promise.all(Array.from({ length: 8 }, () => request(app).get('/api/v1/health')));
    expect(results.every((res) => res.status === 200)).toBe(true);
  });
});
