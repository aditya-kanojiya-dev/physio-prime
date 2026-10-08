import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { categories } from '../db/schema';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(categories.sortOrder, categories.id);
  // ponytail: `id` mirrors the app's slug-as-id contract; `numericId` is what
  // the booking API's categoryId FK wants (a slug there is NaN).
  res.json({
    categories: rows.map((row) => ({
      id: row.slug,
      numericId: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      image: row.image,
      color: row.color,
      conditions: row.conditions,
      sortOrder: row.sortOrder,
    })),
  });
});
