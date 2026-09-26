import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { CATEGORIES_DATA } from '../src/lib/seed-data/categories';
import { SYMPTOMS_DATA } from '../src/lib/seed-data/symptoms';
import { doctors, categories, symptoms } from '../src/db/schema';
import { sql } from 'drizzle-orm';

beforeAll(async () => {
  await runMigrations();
  await db.execute(sql`TRUNCATE doctors, categories, symptoms RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await db.$client.end();
});

describe('seed', () => {
  it('inserts baseline content', async () => {
    await seed();
    const d = await db.select().from(doctors);
    const c = await db.select().from(categories);
    const s = await db.select().from(symptoms);
    expect(d.length).toBeGreaterThan(0);
    // assert against the seed arrays so content edits never stale these counts
    expect(c.length).toBe(CATEGORIES_DATA.length);
    expect(s.length).toBe(SYMPTOMS_DATA.length);
  });
});
