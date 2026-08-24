import pg from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ponytail: inserts in FK-dependency order + reseats sequences so new rows don't collide with imported ids
const BACKUP_DIR = join(import.meta.dirname, '..', '..', 'backup');

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL to the target database first');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

const files = readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
const data = Object.fromEntries(files.map(f => [f.replace('.json', ''), JSON.parse(readFileSync(join(BACKUP_DIR, f), 'utf8'))]));

// topological order from actual FK constraints
const tableList = `(${Object.keys(data).map(t => `'${t}'`).join(',')})`;
const { rows: edges } = await pool.query(`
  select conrelid::regclass::text as from_tbl, confrelid::regclass::text as to_tbl
  from pg_constraint where contype = 'f'
    and conrelid::regclass::text in ${tableList} and confrelid::regclass::text in ${tableList}
`);

const order = [];
const visiting = new Set(), done = new Set();
const visit = t => {
  if (done.has(t)) return;
  if (visiting.has(t)) throw new Error(`circular FK at ${t}`);
  visiting.add(t);
  for (const e of edges.filter(e => e.from_tbl === t)) visit(e.to_tbl);
  visiting.delete(t);
  done.add(t);
  if (data[t]?.length) order.push(t);
};
for (const t of Object.keys(data)) visit(t);

const client = await pool.connect();
await client.query('begin');
try {
  // node-pg parses json/jsonb on read but won't stringify on write — handle those explicitly
  const { rows: jsonCols } = await client.query(`
    select table_name, column_name from information_schema.columns
    where table_schema = 'public' and data_type in ('json', 'jsonb')
  `);
  const jsonByTable = {};
  for (const { table_name, column_name } of jsonCols) {
    (jsonByTable[table_name] ??= new Set()).add(column_name);
  }

  for (const table of order) {
    const rows = data[table];
    const cols = Object.keys(rows[0]);
    const jsonSet = jsonByTable[table] ?? new Set();
    let inserted = 0;
    for (const row of rows) {
      await client.query(
        `insert into "${table}" (${cols.map(c => `"${c}"`).join(',')}) values (${cols.map((_, i) => `$${i + 1}`).join(',')})`,
        cols.map(c => {
          const v = row[c];
          // strings must be re-quoted ("a" -> "\"a\"") or bare-string jsonb values fail
          return jsonSet.has(c) && v != null && (typeof v === 'object' || typeof v === 'string') ? JSON.stringify(v) : v;
        })
      );
      inserted++;
    }
    console.log(`${table}: ${inserted} inserted`);
  }

  // reseat identity/serial sequences past imported ids
  const { rows: seqs } = await client.query(`
    select format('%I.%I', n.nspname, c.relname) as seq, format('%I.%I', tn.nspname, t.relname) as tbl, a.attname as col
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_depend d on d.objid = c.oid and d.deptype = 'a'
    join pg_class t on t.oid = d.refobjid
    join pg_namespace tn on tn.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid
    where c.relkind = 'S' and n.nspname = 'public'
  `);
  for (const s of seqs) {
    const { rows } = await client.query(`select coalesce(max("${s.col}"), 0) as m from ${s.tbl}`);
    if (rows[0].m > 0) {
      await client.query(`select setval('${s.seq}', ${rows[0].m}, true)`);
      console.log(`seq ${s.seq} -> ${rows[0].m}`);
    }
  }

  await client.query('commit');
  console.log('\nrestore complete');
} catch (e) {
  await client.query('rollback');
  console.error('FAILED, rolled back:', e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
