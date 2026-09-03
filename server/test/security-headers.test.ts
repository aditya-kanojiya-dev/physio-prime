import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';
import { createHelmetOptions } from '../src/lib/security-headers';

describe('createHelmetOptions', () => {
  it('enables HSTS only in production', () => {
    expect(createHelmetOptions({ NODE_ENV: 'production' }).strictTransportSecurity).toEqual({
      maxAge: 15_552_000,
      includeSubDomains: true,
    });
    expect(createHelmetOptions({ NODE_ENV: 'test' }).strictTransportSecurity).toBe(false);
  });
});

describe('security headers', () => {
  it('sets browser hardening headers and hides Express', async () => {
    const res = await request(createApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(res.headers['content-security-policy']).toMatch(/default-src 'none'/);
    expect(res.headers['strict-transport-security']).toBeUndefined();
  });
});
