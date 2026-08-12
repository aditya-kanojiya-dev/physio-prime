import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, users } from '../src/db/schema';
import { registerPatient } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

const api = request(createApp());

const DOCTOR_SLUG = 'doc-tarannum-sayyed';

async function doctorToken(): Promise<string> {
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, doc.userId));
  return user.email;
}

async function insertAppointment(
  doctorId: number,
  status: 'upcoming' | 'completed' = 'upcoming',
): Promise<{ id: number; bookingId: string }> {
  const [row] = await db
    .insert(appointments)
    .values({
      bookingId: `APT-${String(Math.floor(100000 + Math.random() * 900000))}`,
      patientId: 1,
      doctorId,
      mode: 'online',
      date: '2026-08-20',
      timeSlot: '10:00-10:30',
      status,
      feePaise: 80000,
      address: {},
      paymentStatus: 'paid',
      patientName: 'Doctor Test Patient',
      patientPhone: '9876543210',
    })
    .returning();
  return { id: row.id, bookingId: row.bookingId };
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

describe('doctor auth gating', () => {
  it('requires a valid token', async () => {
    const res = await api.get('/api/v1/doctor/profile');
    expect(res.status).toBe(401);
  });

  it('rejects patients', async () => {
    const patient = await registerPatient('doc.patient@example.com');
    const res = await api.get('/api/v1/doctor/profile').set('Authorization', `Bearer ${patient.token}`);
    expect(res.status).toBe(403);
  });

  it('rejects doctor-role users with no approved doctors row', async () => {
    const pending = await registerPatient('doc.pending@example.com');
    await db.update(users).set({ role: 'doctor' }).where(eq(users.id, pending.id));
    const res = await api.get('/api/v1/doctor/profile').set('Authorization', `Bearer ${pending.token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('not approved');
  });
});

describe('GET /api/v1/doctor/profile', () => {
  it('returns the doctor profile', async () => {
    const res = await api.get('/api/v1/doctor/profile').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.doctor.slug).toBe(DOCTOR_SLUG);
    expect(res.body.doctor.fees).toBeDefined();
  });
});

describe('PATCH /api/v1/doctor/profile', () => {
  it('updates editable fields', async () => {
    const res = await api
      .patch('/api/v1/doctor/profile')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ fees: { home: 1100, online: 599, clinic: 800 }, bio: 'Updated bio' });
    expect(res.status).toBe(200);
    expect(res.body.doctor.fees.home).toBe(1100);
    expect(res.body.doctor.bio).toBe('Updated bio');
  });

  it('rejects invalid shapes', async () => {
    const res = await api
      .patch('/api/v1/doctor/profile')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ fees: { home: -5 } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/doctor/appointments', () => {
  it('lists own appointments with patient snapshot', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    await insertAppointment(doc.id);

    const res = await api.get('/api/v1/doctor/appointments').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    const ours = res.body.appointments.filter((a: { patientName: string }) => a.patientName === 'Doctor Test Patient');
    expect(ours.length).toBe(1);
    expect(ours[0].id).toBe(ours[0].bookingId);
    expect(ours[0].videoCallLink).toBeDefined();
  });

  it('filters by status and date', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    await insertAppointment(doc.id, 'upcoming');

    const byStatus = await api
      .get('/api/v1/doctor/appointments?status=completed')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(byStatus.status).toBe(200);
    expect(byStatus.body.appointments.every((a: { status: string }) => a.status === 'completed')).toBe(true);

    const byDate = await api
      .get('/api/v1/doctor/appointments?date=2026-08-20')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(byDate.status).toBe(200);
    expect(byDate.body.appointments.length).toBeGreaterThanOrEqual(2);

    const bad = await api
      .get('/api/v1/doctor/appointments?date=2026/08/20')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(bad.status).toBe(400);
  });
});

describe('PATCH /api/v1/doctor/appointments/:id', () => {
  it('marks an upcoming appointment completed', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id);

    const res = await api
      .patch(`/api/v1/doctor/appointments/${apt.bookingId}`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('completed');

    const again = await api
      .patch(`/api/v1/doctor/appointments/${apt.bookingId}`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ status: 'no_show' });
    expect(again.status).toBe(400);
  });

  it('forbids touching another doctor appointment', async () => {
    const [other] = await db.select().from(doctors).where(eq(doctors.slug, 'doc-pritam-rathod'));
    const apt = await insertAppointment(other.id);

    const res = await api
      .patch(`/api/v1/doctor/appointments/${apt.bookingId}`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(403);
  });

  it('404s for unknown booking ids', async () => {
    const res = await api
      .patch('/api/v1/doctor/appointments/APT-000000')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
  });
});

describe('doctor schedules', () => {
  it('lists the seeded week', async () => {
    const res = await api.get('/api/v1/doctor/schedules').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.schedules).toHaveLength(6);
  });

  it('replaces the whole week', async () => {
    const week = Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: '08:00',
      endTime: '18:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      active: dayOfWeek !== 0,
    }));

    const res = await api
      .put('/api/v1/doctor/schedules')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ schedules: week });
    expect(res.status).toBe(200);
    expect(res.body.schedules).toHaveLength(7);
    expect(res.body.schedules.find((s: { dayOfWeek: number }) => s.dayOfWeek === 0).active).toBe(false);
  });

  it('validates time windows', async () => {
    const bad = await api
      .put('/api/v1/doctor/schedules')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ schedules: [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00', active: true }] });
    expect(bad.status).toBe(400);
  });
});
