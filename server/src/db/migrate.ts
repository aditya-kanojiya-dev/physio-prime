import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { db } from './pool';

// ponytail: resolve via cwd (always server/) — survives bundling into dist/,
// where relative ../.. from import.meta.url would point outside the package.
const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder });
}
