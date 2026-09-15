import type { NextFunction, Request, Response } from 'express';

function isoWithMs(d: Date): string {
  return `${d.toISOString().replace('Z', '')}Z`;
}

// ponytail: request log via PM2 stdout — no file rotation needed (PM2 handles it),
// no log lib needed (a few lines do the job). Bodies are never logged (PII).
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      console.log(
        `${isoWithMs(new Date())} ${req.ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`,
      );
    });
    next();
  };
}