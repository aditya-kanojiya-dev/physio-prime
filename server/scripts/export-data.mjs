import pg from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ponytail: JSON-per-table export; restore = drizzle push for schema + import-data.mjs for rows
const OUT_DIR = join(import.meta.dirname, '..', '..', 'backup');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

const tablesRes = await pool.query(`
  select c.relname as table
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname
`);

mkdirSync(OUT_DIR, { recursive: true });
let totalRows = 0;

for (const { table } of tablesRes.rows) {
  const res = await pool.query(`select * from "${table}"`);
  writeFileSync(join(OUT_DIR, `${table}.json`), JSON.stringify(res.rows, null, 2));
  totalRows += res.rows.length;
  console.log(`${table}: ${res.rows.length} rows`);
}

console.log(`\n${tablesRes.rows.length} tables, ${totalRows} total rows -> ${OUT_DIR}`);
await pool.end();
