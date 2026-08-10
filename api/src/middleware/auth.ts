import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type TokenUser } from '../lib/tokens';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    res.status(401).json({ error: { message: 'Unauthorized' } });
  }
}

export function requireRole(...roles: TokenUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: { message: 'Forbidden' } });
      return;
    }
    next();
  };
}
