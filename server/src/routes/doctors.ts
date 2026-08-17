import { Router } from 'express';
import { and, eq, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { doctors, categories, symptoms, doctorLocations } from '../db/schema';
import { getAvailableSlots, getDaySlotCount, isPast, isValidDate } from '../lib/slots';

export const doctorsRouter = Router();

const slotDateSchema = z.string().refine(isValidDate, 'date must be YYYY-MM-DD');

const querySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().max(200).optional(),
  symptom: z.string().max(200).optional(),
  mode: z.enum(['home', 'online', 'clinic']).optional(),
  gender: z.enum(['male', 'female']).optional(),
  maxFee: z.coerce.number().int().positive().optional(),
  sort: z.enum(['recommended', 'price_low', 'rating', 'experience']).optional(),
  area: z.string().max(200).optional(),
});

// ponytail: ILIKE patterns are escaped against % _ \ so a user's q can't act as a wildcard.
function like(value: string): string {
  return `%${value.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

// ponytail: category/symptom titles are token-matched (OR across tokens, a doctor
// wins if ANY token appears in specialty/expertise/treatments, +bio for symptoms)
// so real seeds like "Orthopedic Physiotherapy" vs "Orthopedic & Post-Op" match.
const ignoredTokens = new Set(['and', 'for', 'the', 'of']);
function tokens(title: string): string[] {
  return title
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter((word) => word.length >= 3 && !ignoredTokens.has(word.toLowerCase()));
}
function tokenMatchSql(title: string, withBio: boolean): SQL {
  const clauses = tokens(title).map((token) => {
    const pattern = like(token);
    const parts: SQL[] = [
      sql`${doctors.specialty} ILIKE ${pattern} ESCAPE '\\'`,
      sql`EXISTS (SELECT 1 FROM unnest(${doctors.expertise}) AS _e WHERE _e ILIKE ${pattern} ESCAPE '\\')`,
      sql`EXISTS (SELECT 1 FROM unnest(${doctors.treatments}) AS _t WHERE _t ILIKE ${pattern} ESCAPE '\\')`,
    ];
    if (withBio) parts.push(sql`${doctors.bio} ILIKE ${pattern} ESCAPE '\\'`);
    return sql`(${sql.join(parts, sql` OR `)})`;
  });
  if (clauses.length === 0) return sql`false`;
  return sql`(${sql.join(clauses, sql` OR `)})`;
}

const summaryColumns = {
  name: doctors.name,
  title: doctors.title,
  specialty: doctors.specialty,
  slug: doctors.slug,
  photo: doctors.photo,
  rating: doctors.rating,
  reviewCount: doctors.reviewCount,
  experienceYears: doctors.experienceYears,
  patientsTreated: doctors.patientsTreated,
  languages: doctors.languages,
  location: doctors.location,
  fees: doctors.fees,
  nextAvailable: doctors.nextAvailable,
  verified: doctors.verified,
  featured: doctors.featured,
  gender: doctors.gender,
  bio: doctors.bio,
  // ponytail: added to the list contract so the patient app's home search and
  // booking filters can match on expertise/treatments without a detail fetch per doctor.
  expertise: doctors.expertise,
  treatments: doctors.treatments,
  homeVisitsEnabled: doctors.homeVisitsEnabled,
};

// Least of the present home/online fees; missing ones are treated as +Infinity so a
// doctor with neither never passes maxFee/price_low sorting.
const leastFeeSql = sql`LEAST(
  COALESCE((${doctors.fees}->>'home')::numeric, 'Infinity'::numeric),
  COALESCE((${doctors.fees}->>'online')::numeric, 'Infinity'::numeric)
)`;

doctorsRouter.get('/', async (req, res) => {
  const query = querySchema.parse(req.query);
  const conditions: SQL[] = [];

  if (query.q) {
    const pattern = like(query.q);
    conditions.push(
      sql`(${doctors.name} ILIKE ${pattern} ESCAPE '\\'
        OR ${doctors.title} ILIKE ${pattern} ESCAPE '\\'
        OR ${doctors.specialty} ILIKE ${pattern} ESCAPE '\\')`,
    );
  }
  if (query.category) {
    const [category] = await db
      .select({ title: categories.title })
      .from(categories)
      .where(eq(categories.slug, query.category));
    if (!category) {
      res.json({ doctors: [] });
      return;
    }
    conditions.push(tokenMatchSql(category.title, false));
  }
  if (query.symptom) {
    const [symptom] = await db
      .select({ title: symptoms.title })
      .from(symptoms)
      .where(eq(symptoms.slug, query.symptom));
    if (!symptom) {
      res.json({ doctors: [] });
      return;
    }
    conditions.push(tokenMatchSql(symptom.title, true));
  }
  if (query.mode) {
    conditions.push(sql`${doctors.fees}->>${query.mode} IS NOT NULL`);
  }
  if (query.gender) {
    conditions.push(eq(doctors.gender, query.gender));
  }
  if (query.maxFee != null) {
    conditions.push(sql`${leastFeeSql} <= ${query.maxFee}`);
  }

  // Area filter: when specified, inner-join with doctor_locations.
  if (query.area) {
    conditions.push(eq(doctorLocations.area, query.area));
    conditions.push(eq(doctorLocations.active, true));
    if (query.mode === 'home') {
      conditions.push(eq(doctors.homeVisitsEnabled, true));
    }
  }

  let order: SQL;
  switch (query.sort ?? 'recommended') {
    case 'price_low':
      order = sql`${leastFeeSql} ASC, ${doctors.id} ASC`;
      break;
    case 'rating':
      order = sql`${doctors.rating} DESC, ${doctors.id} ASC`;
      break;
    case 'experience':
      order = sql`${doctors.experienceYears} DESC, ${doctors.id} ASC`;
      break;
    default:
      order = sql`${doctors.featured} DESC, ${doctors.rating} DESC, ${doctors.id} ASC`;
  }

  const rows = await (query.area
    ? db.select(summaryColumns).from(doctors).innerJoin(doctorLocations, eq(doctors.id, doctorLocations.doctorId))
    : db.select(summaryColumns).from(doctors)
  ).where(and(...conditions)).orderBy(order);

  // ponytail: numeric columns arrive as strings from pg; rating is a number in the API
  // contract. `id` mirrors the app's slug-as-id contract (slug == the app's original doc id).
  // Distinct by id in case multiple locations match (area join can duplicate rows).
  const seen = new Set<string>();
  const distinct = rows.filter((row) => {
    if (seen.has(row.slug)) return false;
    seen.add(row.slug);
    return true;
  });

  // Fetch active locations for the returned doctors so the patient app can show area badges.
  const doctorIds = await db
    .select({ id: doctors.id, slug: doctors.slug })
    .from(doctors)
    .where(sql`${doctors.slug} IN ${sql`VALUES ${sql.join([...seen].map((s) => sql`(${s})`), sql`, `)}`}`);
  const idToSlug = new Map(doctorIds.map((r) => [r.id, r.slug]));
  const locRows = doctorIds.length
    ? await db
        .select({
          doctorId: doctorLocations.doctorId,
          id: doctorLocations.id,
          name: doctorLocations.name,
          area: doctorLocations.area,
          city: doctorLocations.city,
          active: doctorLocations.active,
          isPrimary: doctorLocations.isPrimary,
        })
        .from(doctorLocations)
        .where(
          and(
            sql`${doctorLocations.doctorId} IN ${sql`VALUES ${sql.join(doctorIds.map((d) => sql`(${d.id})`), sql`, `)}`}`,
            eq(doctorLocations.active, true),
          ),
        )
    : [];
  const locsBySlug = new Map<string, typeof locRows>();
  for (const loc of locRows) {
    const slug = idToSlug.get(loc.doctorId);
    if (!slug) continue;
    if (!locsBySlug.has(slug)) locsBySlug.set(slug, []);
    locsBySlug.get(slug)!.push(loc);
  }

  res.json({
    doctors: distinct.map((row) => ({
      ...row,
      id: row.slug,
      rating: Number(row.rating),
      locations: (locsBySlug.get(row.slug) || []).map((l) => ({
        id: l.id,
        name: l.name,
        area: l.area,
        city: l.city,
        active: l.active,
        isPrimary: l.isPrimary,
      })),
    })),
  });
});

doctorsRouter.get('/areas', async (_req, res) => {
  const rows = await db
    .selectDistinct({ area: doctorLocations.area })
    .from(doctorLocations)
    .where(eq(doctorLocations.active, true));
  res.json({ areas: rows.map((r) => r.area).filter(Boolean) });
});

doctorsRouter.get('/:slug', async (req, res) => {
  const [row] = await db.select().from(doctors).where(eq(doctors.slug, req.params.slug));
  if (!row) {
    res.status(404).json({ error: { message: 'Doctor not found' } });
    return;
  }
  res.json({
    doctor: {
      id: row.slug,
      name: row.name,
      title: row.title,
      specialty: row.specialty,
      slug: row.slug,
      photo: row.photo,
      rating: Number(row.rating),
      reviewCount: row.reviewCount,
      experienceYears: row.experienceYears,
      patientsTreated: row.patientsTreated,
      languages: row.languages,
      location: row.location,
      fees: row.fees,
      nextAvailable: row.nextAvailable,
      verified: row.verified,
      featured: row.featured,
      gender: row.gender,
      bio: row.bio,
      education: row.education,
      experience: row.experience,
      registration: row.registration,
      expertise: row.expertise,
      treatments: row.treatments,
    },
  });
});

doctorsRouter.get('/:slug/slots', async (req, res, next) => {
  try {
    const parsed = slotDateSchema.safeParse(req.query.date);
    if (!parsed.success) {
      res.status(400).json({ error: { message: 'date must be YYYY-MM-DD' } });
      return;
    }
    if (isPast(parsed.data)) {
      res.status(400).json({ error: { message: 'Date is in the past' } });
      return;
    }
    const [doctor] = await db.select().from(doctors).where(eq(doctors.slug, req.params.slug));
    if (!doctor) {
      res.status(404).json({ error: { message: 'Doctor not found' } });
      return;
    }
    const [slots, total] = await Promise.all([
      getAvailableSlots(doctor.id, parsed.data),
      getDaySlotCount(doctor.id, parsed.data),
    ]);
    res.json({ date: parsed.data, slots, total });
  } catch (err) {
    next(err);
  }
});
