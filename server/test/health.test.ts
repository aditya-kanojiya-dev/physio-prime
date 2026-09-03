import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index';

describe('GET /api/v1/health', () => {
  it('returns ok with db check', async () => {
    const res = await request(createApp()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('ok');
    expect(res.body.ts).toBeDefined();
  });
});
