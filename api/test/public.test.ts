import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { sql, eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { contentSections, categories, users, doctors } from '../src/db/schema';

const api = request(createApp());

beforeAll(async () => {
  await runMigrations();
  await db.execute(sql`TRUNCATE content_sections RESTART IDENTITY CASCADE`);
  await seed();
});

afterAll(async () => {
  await db.$client.end();
});

const leastFee = (d: { fees: { home?: number; online?: number } }): number =>
  Math.min(d.fees.home ?? Infinity, d.fees.online ?? Infinity);

describe('GET /api/v1/categories', () => {
  it('returns 9 active categories with camelCase fields, ordered by sortOrder', async () => {
    const res = await api.get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(9);
    const cat = res.body[0];
    expect(cat).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      slug: expect.any(String),
      description: expect.any(String),
      image: expect.any(String),
      color: expect.any(String),
      conditions: expect.any(Array),
      sortOrder: expect.any(Number),
    });
    expect(res.body.every((c: { id: string; slug: string }) => c.id === c.slug)).toBe(true);
    expect(res.body.map((c: { slug: string }) => c.slug)).toEqual(
      expect.arrayContaining(['orthopedic', 'neurological', 'sports-injury', 'womens-health', 'hand-rehab']),
    );
    const orders = res.body.map((c: { sortOrder: number }) => c.sortOrder);
    expect(orders.every((v: number, i: number) => i === 0 || orders[i - 1] <= v)).toBe(true);
  });
});

describe('GET /api/v1/symptoms', () => {
  it('returns 12 active symptoms with camelCase fields, ordered by sortOrder', async () => {
    const res = await api.get('/api/v1/symptoms');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(12);
    const sym = res.body[0];
    expect(sym).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      slug: expect.any(String),
      iconName: expect.any(String),
      description: expect.any(String),
      popularFor: expect.any(String),
      recoveryEstimate: expect.any(String),
      image: expect.any(String),
      sortOrder: expect.any(Number),
    });
    expect(res.body.map((s: { slug: string }) => s.slug)).toEqual(
      expect.arrayContaining(['back-pain', 'sports-injury', 'stroke-rehab', 'knee-replacement', 'geriatric-care']),
    );
  });
});

describe('GET /api/v1/doctors', () => {
  it('returns all seeded doctors as lightweight summary rows (no detail fields)', async () => {
    const res = await api.get('/api/v1/doctors');
    expect(res.status).toBe(200);
    expect(res.body.doctors).toHaveLength(6);
    const d = res.body.doctors[0];
    expect(d).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      title: expect.any(String),
      specialty: expect.any(String),
      slug: expect.any(String),
      photo: expect.any(String),
      rating: expect.any(Number),
      reviewCount: expect.any(Number),
      experienceYears: expect.any(Number),
      patientsTreated: expect.any(Number),
      languages: expect.any(Array),
      location: { area: expect.any(String), city: expect.any(String), address: expect.any(String) },
      fees: { home: expect.any(Number), online: expect.any(Number), clinic: expect.any(Number) },
      nextAvailable: expect.any(String),
      verified: expect.any(Boolean),
      featured: expect.any(Boolean),
      gender: expect.any(String),
      bio: expect.any(String),
    });
    expect(d.id).toBe(d.slug);
    for (const key of ['education', 'experience', 'registration', 'expertise', 'treatments']) {
      expect(d).not.toHaveProperty(key);
    }
    // default sort = recommended: featured first
    expect(res.body.doctors[0].featured).toBe(true);
  });
});

describe('GET /api/v1/doctors filters', () => {
  it('filters by q, gender, category, and mode', async () => {
    const byQ = await api.get('/api/v1/doctors?q=pritam');
    expect(byQ.status).toBe(200);
    expect(byQ.body.doctors.map((d: { slug: string }) => d.slug)).toEqual(['doc-pritam-rathod']);

    const byGender = await api.get('/api/v1/doctors?gender=female');
    expect(byGender.status).toBe(200);
    expect(byGender.body.doctors).toHaveLength(3);
    expect(byGender.body.doctors.every((d: { gender: string }) => d.gender === 'female')).toBe(true);

    // No seeded doctor's specialty/expertise/treatments contains any full category title,
    // so prove category matching with a runtime-inserted doctor whose expertise uses the
    // real seeded category title.
    const [ortho] = await db
      .select({ title: categories.title })
      .from(categories)
      .where(eq(categories.slug, 'orthopedic'));
    const [probeUser] = await db
      .insert(users)
      .values({
        email: 'cat.probe@physio.example',
        passwordHash: bcrypt.hashSync('probe', 4),
        role: 'doctor',
        name: 'Dr Category Probe',
      })
      .returning({ id: users.id });
    await db.insert(doctors).values({
      userId: probeUser!.id,
      name: 'Dr Category Probe',
      slug: 'doc-category-probe',
      title: 'Probe Physiotherapist',
      specialty: 'General Practice',
      gender: 'male',
      fees: { clinic: 1500 },
      expertise: [ortho!.title],
    });

    const byCategory = await api.get('/api/v1/doctors?category=orthopedic');
    expect(byCategory.status).toBe(200);
    expect(byCategory.body.doctors.map((d: { slug: string }) => d.slug)).toEqual(['doc-category-probe']);

    const categoryPlusGender = await api.get('/api/v1/doctors?category=orthopedic&gender=female');
    expect(categoryPlusGender.body.doctors).toHaveLength(0);

    const modeClinic = await api.get('/api/v1/doctors?mode=clinic');
    expect(modeClinic.status).toBe(200);
    expect(modeClinic.body.doctors).toHaveLength(7);
    const modeHome = await api.get('/api/v1/doctors?mode=home');
    expect(modeHome.status).toBe(200);
    expect(modeHome.body.doctors).toHaveLength(6);
    expect(modeHome.body.doctors.every((d: { fees: { home?: number } }) => d.fees.home != null)).toBe(true);
  });

  it('filters by maxFee on the least of the home/online fees', async () => {
    const res = await api.get('/api/v1/doctors?maxFee=700');
    expect(res.status).toBe(200);
    expect(res.body.doctors).toHaveLength(6);
    expect(res.body.doctors.every((d: { fees: { home?: number; online?: number } }) => leastFee(d) <= 700)).toBe(true);

    const strict = await api.get('/api/v1/doctors?maxFee=450');
    expect(strict.body.doctors.map((d: { slug: string }) => d.slug)).toEqual(['doc-jayshree-ingole']);
  });

  it('sorts by price_low ascending on the least home/online fee', async () => {
    const res = await api.get('/api/v1/doctors?sort=price_low');
    expect(res.status).toBe(200);
    const docs = res.body.doctors;
    expect(docs[0].slug).toBe('doc-jayshree-ingole');
    for (let i = 1; i < docs.length; i++) {
      expect(leastFee(docs[i - 1])).toBeLessThanOrEqual(leastFee(docs[i]));
    }
  });
});

describe('GET /api/v1/doctors/:slug', () => {
  it('returns full detail for a known slug and 404 for an unknown one', async () => {
    const res = await api.get('/api/v1/doctors/doc-tarannum-sayyed');
    expect(res.status).toBe(200);
    const d = res.body.doctor;
    expect(d.slug).toBe('doc-tarannum-sayyed');
    expect(d.education).toEqual(expect.any(Array));
    expect(d.expertise).toEqual(expect.any(Array));
    expect(d.treatments).toEqual(expect.any(Array));
    expect(d.experience).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: expect.any(String), institution: expect.any(String), period: expect.any(String) }),
      ]),
    );
    expect(d.registration).toMatchObject({ number: expect.any(String), council: expect.any(String) });
    expect(d.rating).toBe(4.9);
    expect(d.fees).toEqual({ home: 1000, online: 599, clinic: 800 });

    const missing = await api.get('/api/v1/doctors/not-a-real-doctor');
    expect(missing.status).toBe(404);
  });
});

describe('GET /api/v1/cms/:page', () => {
  it('returns only active sections keyed by key, ordered by sortOrder', async () => {
    const empty = await api.get('/api/v1/cms/home');
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({});

    await db.insert(contentSections).values([
      { page: 'home', key: 'hidden', data: { heading: 'No' }, sortOrder: 0, active: false },
      { page: 'home', key: 'search', data: { heading: 'Find' }, sortOrder: 0, active: true },
      { page: 'home', key: 'hero', data: { heading: 'Hello' }, sortOrder: 1, active: true },
    ]);

    const res = await api.get('/api/v1/cms/home');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ search: { heading: 'Find' }, hero: { heading: 'Hello' } });
  });

  it('rejects an unknown page with 400', async () => {
    const res = await api.get('/api/v1/cms/not-a-page');
    expect(res.status).toBe(400);
  });
});
