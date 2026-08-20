import '../lib/load-env';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// ponytail: PG_POOL_MAX=1 for the test suite (sequential files, one connection beats
// churning ten against a remote Supabase DB); dev/prod default to 10.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.PG_POOL_MAX ?? 10) });

export const db = drizzle(pool, { schema });
