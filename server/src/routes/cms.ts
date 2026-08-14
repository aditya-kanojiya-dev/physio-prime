import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { contentSections } from '../db/schema';

export const cmsRouter = Router();

const pageSchema = z.enum(['home', 'about', 'footer']);

cmsRouter.get('/:page', async (req, res) => {
  const page = pageSchema.parse(req.params.page);
  const rows = await db
    .select()
    .from(contentSections)
    .where(and(eq(contentSections.page, page), eq(contentSections.active, true)))
    .orderBy(contentSections.sortOrder);
  const body: Record<string, unknown> = {};
  for (const row of rows) body[row.key] = row.data;
  res.json(body);
});
