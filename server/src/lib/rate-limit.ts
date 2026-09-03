import type { Request, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function isRateLimitExempt(req: Pick<Request, 'originalUrl' | 'path'>): boolean {
  const url = (req.originalUrl || req.path || '').split('?')[0];
  return url === '/api/v1/health' || url === '/api/v1/razorpay/webhook';
}

const jsonTooManyRequests: RequestHandler = (_req, res) => {
  res.status(429).json({ error: { message: 'Too many requests. Please try again later.' } });
};

const shared = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  skip: isRateLimitExempt,
  handler: jsonTooManyRequests,
  // In-memory store is correct for a single PM2 process. Add Redis if we scale out.
};

export function createAuthLimiter(): RequestHandler {
  return rateLimit({
    ...shared,
    windowMs: envInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
    limit: envInt('RATE_LIMIT_AUTH_MAX', 20),
  });
}

export function createApiLimiter(): RequestHandler {
  return rateLimit({
    ...shared,
    windowMs: envInt('RATE_LIMIT_API_WINDOW_MS', 60 * 1000),
    limit: envInt('RATE_LIMIT_API_MAX', 120),
  });
}
