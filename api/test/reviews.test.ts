import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, reviews } from '../src/db/schema';
import { registerPatient } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

const api = request(createApp());

const DOCTOR = 'doc-tarannum-sayyed';

async function insertAppointment(
  patientId: number,
  status: 'completed' | 'upcoming',
): Promise<{ id: number; doctorId: number; bookingId: string }> {
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR));
  const [row] = await db
    .insert(appointments)
    .values({
      bookingId: `APT-${String(Math.floor(100000 + Math.random() * 900000))}`,
      patientId,
      doctorId: doc.id,
      mode: 'online',
      date: '2026-08-01',
      timeSlot: '09:00-09:30',
      status,
      feePaise: 80000,
      address: {},
      paymentStatus: 'paid',
      patientName: 'Review Patient',
      patientPhone: '9876543210',
    })
    .returning();
  return { id: row.id, doctorId: doc.id, bookingId: row.bookingId };
}

beforeAll(async () => {
  await runMigrations();
  await seed();
});

afterAll(async () => {
  await db.$client.end();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/v1/reviews', () => {
  it('creates a review and recomputes doctor rating/count', async () => {
    const patient = await registerPatient('rev.one@example.com');
    const apt = await insertAppointment(patient.id, 'completed');

    const existing = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.doctorId, apt.doctorId));

    const res = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: apt.id, rating: 5, comment: 'Excellent' });
    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);

    const after = (await db.select().from(doctors).where(eq(doctors.id, apt.doctorId)))[0];
    expect(after.reviewCount).toBe(existing.length + 1);
    const ratings = [...existing.map((r) => r.rating), 5];
    expect(Number(after.rating)).toBe(Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10);
  });

  it('rejects a review on a non-completed appointment', async () => {
    const patient = await registerPatient('rev.upcoming@example.com');
    const apt = await insertAppointment(patient.id, 'upcoming');

    const res = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: apt.id, rating: 4 });
    expect(res.status).toBe(400);
  });

  it('rejects a review not owned by the patient', async () => {
    const owner = await registerPatient('rev.owner@example.com');
    const apt = await insertAppointment(owner.id, 'completed');
    const other = await registerPatient('rev.other@example.com');

    const res = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ appointmentId: apt.id, rating: 3 });
    expect(res.status).toBe(403);
  });

  it('rejects a second review on the same appointment', async () => {
    const patient = await registerPatient('rev.twice@example.com');
    const apt = await insertAppointment(patient.id, 'completed');

    const first = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: apt.id, rating: 4 });
    expect(first.status).toBe(201);

    const second = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: apt.id, rating: 2 });
    expect(second.status).toBe(409);
  });

  it('validates rating range and requires appointmentId', async () => {
    const patient = await registerPatient('rev.bad@example.com');
    const apt = await insertAppointment(patient.id, 'completed');

    const badRating = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: apt.id, rating: 6 });
    expect(badRating.status).toBe(400);

    const missing = await api
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ rating: 3 });
    expect(missing.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await api.post('/api/v1/reviews').send({ appointmentId: 1, rating: 5 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/doctors/:slug/reviews', () => {
  it('returns the doctor reviews newest-first with patient name', async () => {
    const p1 = await registerPatient('rev.list1@example.com');
    const a1 = await insertAppointment(p1.id, 'completed');
    const p2 = await registerPatient('rev.list2@example.com');
    const a2 = await insertAppointment(p2.id, 'completed');

    await api.post('/api/v1/reviews').set('Authorization', `Bearer ${p1.token}`).send({ appointmentId: a1.id, rating: 5, comment: 'Great' });
    await api.post('/api/v1/reviews').set('Authorization', `Bearer ${p2.token}`).send({ appointmentId: a2.id, rating: 3, comment: 'Okay' });

    const res = await api.get(`/api/v1/doctors/${DOCTOR}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.reviews.length).toBeGreaterThanOrEqual(2);
    const ours = res.body.reviews.filter((r: { comment: string }) => r.comment === 'Great' || r.comment === 'Okay');
    expect(ours.length).toBe(2);
    expect(ours[0].comment === 'Okay' || ours[0].comment === 'Great').toBe(true);
    expect(ours[0].patientName).toBe('Test Patient');

    const missing = await api.get('/api/v1/doctors/does-not-exist/reviews');
    expect(missing.status).toBe(404);
  });
});
