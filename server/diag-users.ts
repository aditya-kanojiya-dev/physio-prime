import { sql } from 'drizzle-orm';
import { db, pool } from './src/db/pool';
import { runMigrations } from './src/db/migrate';
import { seed } from './src/lib/seed';

async function main() {
  await runMigrations();
  await seed();
  const rows = await db.execute(sql`select email, role, id from users order by id`);
  console.log('after migrate+seed users:', JSON.stringify(rows.rows, null, 1));
  await pool.end();
}
main();
