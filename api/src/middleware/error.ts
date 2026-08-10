import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { issues: err.issues } });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: { message } });
}
