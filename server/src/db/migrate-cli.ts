import { runMigrations } from './migrate';
import { pool } from './pool';

runMigrations()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });