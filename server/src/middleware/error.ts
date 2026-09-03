import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

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

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err);
  if (res.headersSent) return;

  const { status, body } = resolveClientError(err);
  res.status(status).json(body);
}
