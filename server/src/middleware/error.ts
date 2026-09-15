import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { notifyAdmin } from '../lib/notifications';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export type ClientErrorBody = {
  error: { message?: string; issues?: ZodError['issues'] };
};

function isJsonSyntaxError(err: unknown): boolean {
  return err instanceof SyntaxError && 'body' in err;
}

function isPayloadTooLarge(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && (err as { type: string }).type === 'entity.too.large';
}

export function resolveClientError(
  err: unknown,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): { status: number; body: ClientErrorBody } {
  if (err instanceof ZodError) {
    return { status: 400, body: { error: { issues: err.issues } } };
  }
  if (isJsonSyntaxError(err)) {
    return { status: 400, body: { error: { message: 'Invalid JSON body' } } };
  }
  if (isPayloadTooLarge(err)) {
    return { status: 413, body: { error: { message: 'Request body is too large' } } };
  }

  const isProd = nodeEnv === 'production';
  const detail = err instanceof Error ? err.message : 'Internal Server Error';
  return {
    status: 500,
    body: { error: { message: isProd ? GENERIC_MESSAGE : detail } },
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  if (res.headersSent) return;

  const { status, body } = resolveClientError(err);
  res.status(status).json(body);

  // Persist unexpected failures (5xx) to admin alerts — fire-and-forget, never
  // blocks the error response. Notify only when the server is actually broken,
  // not for 4xx client mistakes.
  if (status >= 500) {
    void notifyAdmin({
      type: 'server_error',
      title: `500 ${req.method} ${req.originalUrl}`,
      body: err instanceof Error ? err.message : 'Internal Server Error',
      metadata: {
        method: req.method,
        path: req.originalUrl,
        userId: (req as Request & { user?: { id?: number } }).user?.id ?? null,
        stack: err instanceof Error ? err.stack ?? null : null,
      },
    });
  }
}
