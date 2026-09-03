import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/pool';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ ok: true, db: 'ok', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, db: 'error' });
  }
});
