import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
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
    expect(c.length).toBe(9);
    expect(s.length).toBe(12);
  });
});
