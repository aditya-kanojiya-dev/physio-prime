import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, doctorSchedules, users } from '../src/db/schema';
import { registerPatient, futureWeekday } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

// The join-window guard runs *after* jaasConfigured(), so the suite needs JaaS to
// look configured. The private key is never used: an out-of-window request is
// rejected before signJaasJwt() is reached.
process.env.JAAS_APP_ID ??= 'ci-test-app';
process.env.JAAS_API_KEY_ID ??= 'ci-test-key';
process.env.JAAS_PRIVATE_KEY ??= 'ci-test-private-key';

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
  patientId = 1,
): Promise<{ id: number; bookingId: string }> {
  const [row] = await db
    .insert(appointments)
    .values({
      bookingId: `APT-${String(Math.floor(100000 + Math.random() * 900000))}`,
      patientId,
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
      .send({ bio: 'Updated bio', languages: ['en', 'hi'] });
    expect(res.status).toBe(200);
    expect(res.body.doctor.bio).toBe('Updated bio');
    expect(res.body.doctor.languages).toEqual(['en', 'hi']);
  });

  it('rejects invalid shapes', async () => {
    const res = await api
      .patch('/api/v1/doctor/profile')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ bio: 123 });
    expect(res.status).toBe(400);
  });

  it('persists name and gender and keeps users.name in sync', async () => {
    const token = await doctorToken();
    const res = await api
      .patch('/api/v1/doctor/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dr. Tarannum Edited', gender: 'female' });
    expect(res.status).toBe(200);
    expect(res.body.doctor.name).toBe('Dr. Tarannum Edited');
    expect(res.body.doctor.gender).toBe('female');

    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, doc.userId));
    expect(user?.name).toBe('Dr. Tarannum Edited');

    const me = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.user.name).toBe('Dr. Tarannum Edited');
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
    // No stored room URL. The doctor joins via /doctor/appointments/:id/video-token.
    expect(ours[0].videoCallLink).toBeUndefined();
    // So the portal can disable its Join button instead of erroring on click.
    expect(ours[0].videoJoinable).toBe(false);
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

describe('POST /api/v1/doctor/appointments/:id/prescription', () => {
  it('writes a prescription for a completed appointment', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id, 'completed');
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));

    const res = await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({
        diagnosis: 'Lower back strain',
        medicines: [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'twice daily', duration: '7 days' }],
        advice: 'Rest and light stretching',
        followUpDate: '2026-09-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.prescription.diagnosis).toBe('Lower back strain');
    expect(res.body.prescription.medicines[0].name).toBe('Ibuprofen');
  });

  it('rejects duplicates for the same appointment', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id, 'completed');
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));

    const first = await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'First' });
    expect(first.status).toBe(201);

    const second = await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'Second' });
    expect(second.status).toBe(409);
  });

  it('rejects prescriptions on non-completed appointments', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id, 'upcoming');

    const res = await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'Early' });
    expect(res.status).toBe(400);
  });

  it('forbids writing for another doctor appointment', async () => {
    const [other] = await db.select().from(doctors).where(eq(doctors.slug, 'doc-pritam-rathod'));
    const apt = await insertAppointment(other.id, 'completed');
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));

    const res = await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'Sneaky' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/doctor/patients', () => {
  let patient: { id: number };

  beforeAll(async () => {
    patient = await registerPatient('doctor.my.patient@example.com');
  });

  it('lists only patients with completed visits', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const done = await insertAppointment(doc.id, 'completed', patient.id);
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, done.id));
    await insertAppointment(doc.id, 'upcoming', patient.id);

    const res = await api.get('/api/v1/doctor/patients').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    const found = res.body.patients.find((p: { id: number }) => p.id === patient.id);
    expect(found).toBeDefined();
    expect(found.visitCount).toBeGreaterThanOrEqual(1);
    expect(found.name).toBe('Doctor Test Patient');
  });

  it('404s for a patient the doctor never completed a visit with', async () => {
    const res = await api.get('/api/v1/doctor/patients/999999').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/doctor/patients/:id', () => {
  let patient: { id: number };

  beforeAll(async () => {
    patient = await registerPatient('doctor.my.patient.detail@example.com');
  });

  it('returns profile, own appointment history and own prescriptions', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id, 'completed', patient.id);
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));
    await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'Follow-up strain', medicines: [{ name: 'Paracetamol' }] });

    const res = await api
      .get(`/api/v1/doctor/patients/${patient.id}`)
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBeDefined();
    expect(res.body.appointments.length).toBeGreaterThanOrEqual(1);
    const rx = res.body.prescriptions.find((p: { diagnosis: string }) => p.diagnosis === 'Follow-up strain');
    expect(rx).toBeDefined();
    expect(res.body.summary).toBeUndefined();
  });

  it('forbids viewing a patient the doctor never treated', async () => {
    const other = await registerPatient('doctor.not.my.patient@example.com');
    const [otherDoc] = await db.select().from(doctors).where(eq(doctors.slug, 'doc-pritam-rathod'));
    const apt = await insertAppointment(otherDoc.id, 'completed', other.id);
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));

    const res = await api
      .get(`/api/v1/doctor/patients/${other.id}`)
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/doctor/appointments/:id', () => {
  it('returns own appointment with prescription', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id, 'completed');
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));
    await api
      .post(`/api/v1/doctor/appointments/${apt.bookingId}/prescription`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ diagnosis: 'Detail view' });

    const res = await api
      .get(`/api/v1/doctor/appointments/${apt.bookingId}`)
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.appointment.bookingId).toBe(apt.bookingId);
    expect(res.body.prescription.diagnosis).toBe('Detail view');
  });

  it('forbids viewing another doctor appointment', async () => {
    const [other] = await db.select().from(doctors).where(eq(doctors.slug, 'doc-pritam-rathod'));
    const apt = await insertAppointment(other.id, 'completed');
    await db.update(appointments).set({ status: 'completed' }).where(eq(appointments.id, apt.id));

    const res = await api
      .get(`/api/v1/doctor/appointments/${apt.bookingId}`)
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(403);
  });

  it('404s for unknown booking ids', async () => {
    const res = await api
      .get('/api/v1/doctor/appointments/APT-000000')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(404);
  });
});

describe('doctor schedules', () => {
  it('lists the seeded week with HH:MM times (no seconds)', async () => {
    const res = await api.get('/api/v1/doctor/schedules').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.schedules).toHaveLength(30);
    const days = new Set<number>();
    for (const s of res.body.schedules) {
      expect(s.windowStart).toMatch(/^\d{2}:\d{2}$/);
      expect(s.windowEnd).toMatch(/^\d{2}:\d{2}$/);
      expect(s.active).toBe(true);
      days.add(s.dayOfWeek);
    }
    expect([...days].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('replaces the whole week (inactive windows are dropped)', async () => {
    const windows = [
      ...Array.from({ length: 6 }, (_, i) => ({
        dayOfWeek: i + 1,
        windowStart: '08:00',
        windowEnd: '10:00',
        maxPatients: 2,
        active: true,
      })),
      { dayOfWeek: 0, windowStart: '08:00', windowEnd: '10:00', maxPatients: 2, active: false },
    ];

    const put = await api
      .put('/api/v1/doctor/schedules')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ windows });
    expect(put.status).toBe(200);
    expect(put.body.schedules).toHaveLength(6);

    const get = await api.get('/api/v1/doctor/schedules').set('Authorization', `Bearer ${await doctorToken()}`);
    expect(get.status).toBe(200);
    expect(get.body.schedules).toHaveLength(6);
    expect(get.body.schedules.every((s: { active: boolean }) => s.active)).toBe(true);
    expect(get.body.schedules.find((s: { dayOfWeek: number }) => s.dayOfWeek === 0)).toBeUndefined();
    expect(get.body.schedules[0].windowStart).toBe('08:00');
  });

  it('validates time windows', async () => {
    const bad = await api
      .put('/api/v1/doctor/schedules')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ windows: [{ dayOfWeek: 1, windowStart: '08:00', windowEnd: '10:00', maxPatients: 0, active: true }] });
    expect(bad.status).toBe(400);
  });
});

describe('GET /api/v1/doctor/slots', () => {
  it('returns available windows for a future date', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const scheds = await db
      .select()
      .from(doctorSchedules)
      .where(and(eq(doctorSchedules.doctorId, doc.id), eq(doctorSchedules.active, true)));
    expect(scheds.length).toBeGreaterThan(0);

    const date = futureWeekday(scheds[0].dayOfWeek);
    const res = await api.get(`/api/v1/doctor/slots?date=${date}`).set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(date);
    expect(Array.isArray(res.body.windows)).toBe(true);
    expect(res.body.windows.length).toBeGreaterThan(0);
    expect(res.body.windows[0].start).toMatch(/^\d{2}:\d{2}$/);
    expect(res.body.windows[0].end).toMatch(/^\d{2}:\d{2}$/);
  });

  it('rejects past and malformed dates', async () => {
    const past = await api
      .get('/api/v1/doctor/slots?date=2020-01-01')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(past.status).toBe(400);

    const bad = await api
      .get('/api/v1/doctor/slots?date=2026/08/20')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(bad.status).toBe(400);
  });
});

describe('PATCH /api/v1/doctor/appointments/:id/reschedule', () => {
  async function reschedule(bookingId: string, body: Record<string, string>) {
    return api
      .patch(`/api/v1/doctor/appointments/${bookingId}/reschedule`)
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send(body);
  }

  it('moves an upcoming appointment to a free slot in the window', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id);
    const scheds = await db
      .select()
      .from(doctorSchedules)
      .where(and(eq(doctorSchedules.doctorId, doc.id), eq(doctorSchedules.active, true)));
    const date = futureWeekday(scheds[0].dayOfWeek);

    const res = await reschedule(apt.bookingId, {
      date,
      windowStart: scheds[0].windowStart.slice(0, 5),
      windowEnd: scheds[0].windowEnd.slice(0, 5),
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newTimeSlot).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);

    const [row] = await db.select({ date: appointments.date, timeSlot: appointments.timeSlot }).from(appointments).where(eq(appointments.id, apt.id));
    expect(row?.date).toBe(date);
  });

  it('rejects a past date', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id);

    const res = await reschedule(apt.bookingId, { date: '2020-01-01', windowStart: '08:00', windowEnd: '09:00' });
    expect(res.status).toBe(400);
  });

  it('rejects malformed window times', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const apt = await insertAppointment(doc.id);

    const res = await reschedule(apt.bookingId, { date: futureWeekday(1), windowStart: '8:00', windowEnd: '09:00' });
    expect(res.status).toBe(400);
  });

  it('rejects rescheduling another doctor appointment', async () => {
    const [other] = await db.select().from(doctors).where(eq(doctors.slug, 'doc-pritam-rathod'));
    const apt = await insertAppointment(other.id);

    const res = await reschedule(apt.bookingId, { date: futureWeekday(1), windowStart: '08:00', windowEnd: '09:00' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/doctor/appointments/:id/video-token', () => {
  it('refuses a join outside the 15 minute window, same as the patient', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const appt = await insertAppointment(doc.id);

    const res = await api
      .get(`/api/v1/doctor/appointments/${appt.bookingId}/video-token`)
      .set('Authorization', `Bearer ${await doctorToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/opens 15 minutes before/);
  });

  it('refuses a non-existent appointment', async () => {
    const res = await api
      .get('/api/v1/doctor/appointments/APT-000000/video-token')
      .set('Authorization', `Bearer ${await doctorToken()}`);
    expect(res.status).toBe(404);
  });
});
