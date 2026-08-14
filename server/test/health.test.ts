import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';

describe('GET /api/v1/health', () => {
  it('returns ok with service name', async () => {
    const res = await request(createApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'physio-prime-api' });
  });
});
