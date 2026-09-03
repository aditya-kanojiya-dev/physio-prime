/** Number of reverse-proxy hops Express should trust when reading client IP. */
export function trustProxyHops(env: { NODE_ENV?: string; TRUST_PROXY?: string } = process.env): number | false {
  const raw = env.TRUST_PROXY?.trim();
  if (raw === '0' || raw === 'false') return false;
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  // Production sits behind Nginx (DEPLOY.md). Never use `true` — clients can spoof X-Forwarded-For.
  return env.NODE_ENV === 'production' ? 1 : false;
}
