import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JSON body size limit', () => {
  it('rejects payloads larger than 512kb with a 413', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const oversized = { content: 'x'.repeat(513 * 1024) };
    const res = await request(createApp())
      .patch('/api/v1/auth/me')
      .set('Content-Type', 'application/json')
      .send(oversized);
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: { message: 'Request body is too large' } });
  });

  it('accepts a small JSON body (auth still applies after the parser)', async () => {
    const res = await request(createApp()).patch('/api/v1/auth/me').send({ name: 'ok' });
    expect(res.status).toBe(401);
  });
});
