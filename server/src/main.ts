import './lib/load-env';
import { runMigrations } from './db/migrate';
import { createApp } from './index';
import { pool } from './db/pool';

// Production entry: applies pending Drizzle migrations, then starts the API.
// Idempotent — safe to run on every PM2 start/deploy. tsx is used because the
// server's build step is type-check only (`tsc --noEmit`).
const port = Number(process.env.PORT) || 4000;

async function start() {
  await runMigrations();
  createApp().listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

start().catch(async (err) => {
  console.error('Failed to start API:', err);
  await pool.end();
  process.exit(1);
});
