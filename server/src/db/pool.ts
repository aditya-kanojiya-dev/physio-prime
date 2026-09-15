import '../lib/load-env';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// ponytail: PG_POOL_MAX=1 for the test suite (sequential files, one connection beats
// churning ten against a remote Supabase DB); dev/prod default to 10.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // Unhandled error on an idle client — log and keep the pool alive.
  console.error('[pg] idle client error:', err.message);
});

export const db = drizzle(pool, { schema });
