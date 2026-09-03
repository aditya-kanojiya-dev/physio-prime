import helmet from 'helmet';
import type { HelmetOptions } from 'helmet';

export function createHelmetOptions(env: { NODE_ENV?: string } = process.env): HelmetOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    // JSON API: deny all resource loads if a browser ever renders a response as HTML.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    // Helmet's default CORP is `same-origin`, which blocks the patient/admin
    // Vite apps on another origin/port from reading API responses.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // HSTS on HTTP localhost can pin the browser to HTTPS and break local dev.
    strictTransportSecurity: isProd
      ? { maxAge: 15_552_000, includeSubDomains: true }
      : false,
  };
}

export function securityHeaders() {
  return helmet(createHelmetOptions());
}
