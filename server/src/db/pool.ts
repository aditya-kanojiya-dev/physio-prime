import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const repoRoot =
  typeof import.meta.url === 'string' ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..') : process.cwd();
loadEnv({ path: path.join(repoRoot, '.env') });

// ponytail: PG_POOL_MAX=1 for the test suite (sequential files, one connection beats
// churning ten against a remote Supabase DB); dev/prod default to 10.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.PG_POOL_MAX ?? 10) });

export const db = drizzle(pool, { schema });
