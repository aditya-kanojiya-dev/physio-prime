import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool';
import { symptoms } from '../db/schema';

export const symptomsRouter = Router();

symptomsRouter.get('/', async (_req, res) => {
  const rows = await db
    .select()
    .from(symptoms)
    .where(eq(symptoms.active, true))
    .orderBy(symptoms.sortOrder, symptoms.id);
  // ponytail: `id` mirrors the app's slug-as-id contract.
  res.json(
    rows.map((row) => ({
      id: row.slug,
      title: row.title,
      slug: row.slug,
      iconName: row.iconName,
      description: row.description,
      popularFor: row.popularFor,
      recoveryEstimate: row.recoveryEstimate,
      image: row.image,
      sortOrder: row.sortOrder,
    })),
  );
});
