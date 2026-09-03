import type { CorsOptions } from 'cors';

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
] as const;

function originFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function withWwwTwin(origin: string, into: Set<string>): void {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return;
  }
  const { hostname } = url;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return;
  }
  if (hostname.startsWith('www.')) {
    url.hostname = hostname.slice(4);
  } else {
    url.hostname = `www.${hostname}`;
  }
  into.add(url.origin);
}

export function parseAllowedOrigins(env: {
  APP_URL?: string;
  CORS_ORIGINS?: string;
  NODE_ENV?: string;
}): Set<string> {
  const allowed = new Set<string>();

  const appOrigin = env.APP_URL ? originFromUrl(env.APP_URL) : null;
  if (appOrigin) {
    allowed.add(appOrigin);
    withWwwTwin(appOrigin, allowed);
  }

  if (env.CORS_ORIGINS) {
    for (const part of env.CORS_ORIGINS.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const origin = originFromUrl(trimmed) ?? trimmed.replace(/\/+$/, '');
      if (origin) allowed.add(origin);
    }
  }

  if (env.NODE_ENV !== 'production') {
    for (const origin of DEV_ORIGINS) allowed.add(origin);
  }

  return allowed;
}

export function getAllowedCorsOrigins(): Set<string> {
  return parseAllowedOrigins({
    APP_URL: process.env.APP_URL,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    NODE_ENV: process.env.NODE_ENV,
  });
}

export function createCorsOptions(): CorsOptions {
  return {
    origin(requestOrigin, callback) {
      // Same-origin, curl, Razorpay webhooks, and server-to-server have no Origin.
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      callback(null, getAllowedCorsOrigins().has(requestOrigin));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
}
