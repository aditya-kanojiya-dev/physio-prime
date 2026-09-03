import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z, ZodError } from 'zod';
import { errorHandler, resolveClientError } from '../src/middleware/error';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveClientError', () => {
  it('returns Zod issues as 400', () => {
    let caught: ZodError | undefined;
    try {
      z.object({ email: z.string().email() }).parse({ email: 'nope' });
    } catch (err) {
      caught = err as ZodError;
    }
    const result = resolveClientError(caught);
    expect(result.status).toBe(400);
    expect(result.body.error.issues?.length).toBeGreaterThan(0);
  });

  it('hides Error.message in production and keeps it in development', () => {
    const err = new Error('relation "users" does not exist');
    expect(resolveClientError(err, 'production').body.error.message).toBe(
      'Something went wrong. Please try again.',
    );
    expect(resolveClientError(err, 'development').body.error.message).toBe(
      'relation "users" does not exist',
    );
  });

  it('maps invalid JSON and oversized bodies to 4xx without leaking internals', () => {
    const jsonErr = Object.assign(new SyntaxError('Unexpected token'), { body: 'not-json' });
    expect(resolveClientError(jsonErr, 'production')).toEqual({
      status: 400,
      body: { error: { message: 'Invalid JSON body' } },
    });
    const bulky = Object.assign(new Error('too large'), { type: 'entity.too.large' });
    expect(resolveClientError(bulky, 'production').status).toBe(413);
  });
});

describe('errorHandler', () => {
  it('logs the full error and returns a generic 500 in production', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const app = express();
    app.get('/boom', () => {
      throw new Error('SELECT * FROM secrets');
    });
    app.use(errorHandler);

    const res = await request(app).get('/boom');
    process.env.NODE_ENV = previous;

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'Something went wrong. Please try again.' } });
    expect(log).toHaveBeenCalled();
  });
});
