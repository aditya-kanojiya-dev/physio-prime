import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, doctorSchedules } from '../src/db/schema';
import { buildSlotList, dayOfWeek, nowHHmm, todayStr, type Slot } from '../src/lib/slots';
import { registerPatient } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

import { createOrder, createRefund, verifySignature, verifyWebhookSignature } from '../src/lib/razorpay';

const api = request(createApp());

const DOCTOR = 'doc-tarannum-sayyed';
const SECOND_DOCTOR = 'doc-pritam-rathod';

const MONDAY = futureDate(1);
const SUNDAY = futureDate(0);

function futureDate(dayOfWeek: number): string {
  const d = new Date();
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  while (cur.getDay() !== dayOfWeek) {
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
}

const bookPayload = (overrides: Record<string, unknown> = {}) => ({
  doctorSlug: DOCTOR,
  mode: 'online',
  date: MONDAY,
  slot: '10:00-10:45',
  symptom: 'Knee pain',
  patientName: 'Test Patient',
  patientPhone: '9876543210',
  ...overrides,
});

async function expectedSlots(date: string, slug: string): Promise<Slot[]> {
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, slug));
  if (!doc) return [];
  const [sched] = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doc.id),
        eq(doctorSchedules.dayOfWeek, dayOfWeek(date)),
        eq(doctorSchedules.active, true),
      ),
    );
  if (!sched) return [];
  const booked = await db
    .select({ timeSlot: appointments.timeSlot })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doc.id),
        eq(appointments.date, date),
        inArray(appointments.status, ['upcoming', 'completed']),
      ),
    );
  const bookedStarts = new Set(booked.map((a) => a.timeSlot.split('-')[0]));
  const now = nowHHmm();
  return buildSlotList(sched).filter(
    (s) => !bookedStarts.has(s.start) && !(date === todayStr() && s.start <= now),
  );
}

beforeAll(async () => {
  await runMigrations();
  await seed();
});

afterAll(async () => {
  await db.$client.end();
});

beforeEach(() => {
  vi.mocked(createOrder).mockReset();
  vi.mocked(verifySignature).mockReset();
  vi.mocked(createRefund).mockReset();
  vi.mocked(verifyWebhookSignature).mockReset();
  vi.mocked(createOrder).mockImplementation(async ({ amountPaise }) => ({
    id: 'order_default',
    amountPaise,
  }));
  vi.mocked(verifySignature).mockReturnValue(true);
  vi.mocked(createRefund).mockResolvedValue();
  vi.mocked(verifyWebhookSignature).mockReturnValue(true);
});

describe('GET /api/v1/appointments', () => {
  it('returns an empty list for a fresh patient and 401 without a token', async () => {
    const { token } = await registerPatient('apt.empty@example.com');
    const res = await api.get('/api/v1/appointments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.appointments).toEqual([]);

    const noAuth = await api.get('/api/v1/appointments');
    expect(noAuth.status).toBe(401);
  });
});

describe('POST /api/v1/appointments', () => {
  it('books an online slot with correct fee_paise, APT-xxxxxx id and echoed razorpay order', async () => {
    const { token } = await registerPatient('apt.book@example.com');
    const doc = await api.get(`/api/v1/doctors/${DOCTOR}`);
    const feePaise = Math.round(doc.body.doctor.fees.online * 100);

    const res = await api.post('/api/v1/appointments').set('Authorization', `Bearer ${token}`).send(bookPayload());
    expect(res.status).toBe(201);
    expect(res.body.appointment.paymentStatus).toBe('pending');
    expect(res.body.appointment.status).toBe('upcoming');
    expect(res.body.appointment.feePaise).toBe(feePaise);
    expect(res.body.appointment.bookingId ?? res.body.appointment.id).toMatch(/^APT-\d{6}$/);
    expect(res.body.appointment.razorpayOrderId).toBe('order_default');
    expect(res.body.appointment.doctor.id).toBe(DOCTOR);
    expect(res.body.appointment.videoCallLink).toBe(
      `https://meet.physioprime.in/${res.body.appointment.id}`,
    );
    expect(res.body.razorpayOrder).toEqual({ id: 'order_default', amountPaise: feePaise });
    expect(res.body.appointment.patientName).toBe('Test Patient');
  });

  it('stores patient email/gender/age/weight/height and falls back email to the auth email', async () => {
    const { token } = await registerPatient('apt.patientdetails@example.com');
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '14:30-15:15', patientGender: 'female', patientAge: 29, patientWeight: 58.5, patientHeight: 165 }));
    expect(res.status).toBe(201);
    expect(res.body.appointment.patientEmail).toBe('apt.patientdetails@example.com');
    expect(res.body.appointment.patientGender).toBe('female');
    expect(res.body.appointment.patientAge).toBe(29);
    expect(res.body.appointment.patientWeight).toBe('58.5');
    expect(res.body.appointment.patientHeight).toBe('165');

    const list = await api.get('/api/v1/appointments').set('Authorization', `Bearer ${token}`);
    const apt = list.body.appointments.find((a: { id: string }) => a.id === res.body.appointment.id);
    expect(apt.patientEmail).toBe('apt.patientdetails@example.com');
    expect(apt.patientAge).toBe(29);
  });

  it('returns 409 when the same doctor+date+slot is already booked', async () => {
    const { token } = await registerPatient('apt.dup@example.com');
    await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '12:15-13:00' }))
      .expect(201);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '12:15-13:00' }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/appointments validation', () => {
  it('returns 404 for an unknown doctor', async () => {
    const { token } = await registerPatient('apt.baddoc@example.com');
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: 'not-a-doctor' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 for a past date', async () => {
    const { token } = await registerPatient('apt.past@example.com');
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ date: '2000-01-01' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid slot format', async () => {
    const { token } = await registerPatient('apt.slot@example.com');
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '10:00' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a date that is not a real calendar date', async () => {
    const { token } = await registerPatient('apt.baddate@example.com');
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ date: '2026-13-45' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when the mode is not offered by the doctor', async () => {
    const { token } = await registerPatient('apt.mode@example.com');
    await db
      .update(doctors)
      .set({ fees: { home: 1000, online: 599 } })
      .where(eq(doctors.slug, SECOND_DOCTOR));
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, mode: 'clinic' }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/doctors/:slug/slots', () => {
  it('returns the weekday 45-min list minus the break band and booked slots', async () => {
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${MONDAY}`);
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(MONDAY);
    expect(res.body.slots).toEqual(await expectedSlots(MONDAY, DOCTOR));
    expect(res.body.slots).toHaveLength((await expectedSlots(MONDAY, DOCTOR)).length);
    const [slotDoc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR));
    const [slotSched] = await db
      .select()
      .from(doctorSchedules)
      .where(
        and(
          eq(doctorSchedules.doctorId, slotDoc.id),
          eq(doctorSchedules.dayOfWeek, dayOfWeek(MONDAY)),
          eq(doctorSchedules.active, true),
        ),
      );
    expect(res.body.total).toBe(buildSlotList(slotSched).length);
    expect(res.body.slots[0]).toEqual({ start: '07:00', end: '07:45' });
    expect(res.body.slots[res.body.slots.length - 1]).toEqual({ start: '19:45', end: '20:30' });
    expect(res.body.slots.some((s: Slot) => s.start === '13:00' || s.start === '13:45')).toBe(false);
    expect(res.body.slots.some((s: Slot) => s.start === '10:00')).toBe(false);
  });

  it('returns an empty list on Sunday', async () => {
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${SUNDAY}`);
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]);
  });

  it('excludes past times when the date is today', async () => {
    const today = todayStr();
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${today}`);
    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual(await expectedSlots(today, DOCTOR));
    const now = nowHHmm();
    expect(res.body.slots.every((s: Slot) => s.start > now)).toBe(true);
  });

  it('returns 404 for an unknown doctor, 400 for a past/invalid date', async () => {
    const missing = await api.get(`/api/v1/doctors/not-a-doctor/slots?date=${MONDAY}`);
    expect(missing.status).toBe(404);

    const past = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=2000-01-01`);
    expect(past.status).toBe(400);

    const bad = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=tomorrow`);
    expect(bad.status).toBe(400);

    const badCalendar = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=2026-02-30`);
    expect(badCalendar.status).toBe(400);
  });
});

describe('POST /api/v1/appointments/:id/verify', () => {
  it('marks an appointment paid with a valid signature and is idempotent on repeat', async () => {
    const { token } = await registerPatient('apt.verify@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '15:15-16:00' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_abc', razorpaySignature: 'sig_ok' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.paymentStatus).toBe('paid');
    expect(res.body.appointment.razorpayPaymentId).toBe('pay_abc');

    const repeat = await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_abc', razorpaySignature: 'sig_ok' });
    expect(repeat.status).toBe(200);
    expect(repeat.body.appointment.paymentStatus).toBe('paid');
  });

  it('returns 400 for a bad signature and 403 for a non-owner', async () => {
    const { token } = await registerPatient('apt.badsig@example.com');
    const { token: otherToken } = await registerPatient('apt.other@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '16:00-16:45' }))
      .expect(201);
    const id = booked.body.appointment.id;

    vi.mocked(verifySignature).mockReturnValueOnce(false);
    const bad = await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_bad', razorpaySignature: 'sig_bad' });
    expect(bad.status).toBe(400);

    const forbidden = await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ razorpayPaymentId: 'pay_x', razorpaySignature: 'sig_x' });
    expect(forbidden.status).toBe(403);
  });

  it('returns 400 on verify for a cancelled appointment even when still marked paid', async () => {
    const { token } = await registerPatient('apt.verifycancelled@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '11:30-12:15' }))
      .expect(201);
    const id = booked.body.appointment.id;

    await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_vc', razorpaySignature: 'sig' })
      .expect(200);

    vi.mocked(createRefund).mockRejectedValueOnce(new Error('razorpay down'));
    await api
      .post(`/api/v1/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'no refund possible' })
      .expect(200);

    const res = await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_vc', razorpaySignature: 'sig' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/appointments/:id/reschedule', () => {
  it('reschedules to a free slot, 409 on a taken slot, 400 on a cancelled appointment', async () => {
    const { token } = await registerPatient('apt.reschedule@example.com');
    const taken = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '09:15-10:00' }))
      .expect(201);

    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '08:30-09:15' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const ok = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: '16:45-17:30' });
    expect(ok.status).toBe(200);
    expect(ok.body.appointment.timeSlot).toBe('16:45-17:30');

    const conflict = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: '09:15-10:00' });
    expect(conflict.status).toBe(409);

    await api
      .post(`/api/v1/appointments/${taken.body.appointment.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'changed mind' })
      .expect(200);

    const cancelled = await api
      .post(`/api/v1/appointments/${taken.body.appointment.id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: '12:15-13:00' });
    expect(cancelled.status).toBe(400);
  });

  it('returns 200 unchanged when rescheduling to the identical date+slot', async () => {
    const { token } = await registerPatient('apt.noop@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: '10:45-11:30' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: '10:45-11:30' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.date).toBe(MONDAY);
    expect(res.body.appointment.timeSlot).toBe('10:45-11:30');
  });
});

describe('POST /api/v1/appointments/:id/cancel', () => {
  it('cancels a pending appointment and keeps payment pending', async () => {
    const { token } = await registerPatient('apt.cancel@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot: '09:15-10:00' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await api
      .post(`/api/v1/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'no longer needed' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('cancelled');
    expect(res.body.appointment.paymentStatus).toBe('pending');
    expect(res.body.appointment.cancellationReason).toBe('no longer needed');
  });

  it('cancels a paid appointment and refunds via razorpay', async () => {
    const { token } = await registerPatient('apt.refund@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot: '10:45-11:30' }))
      .expect(201);
    const id = booked.body.appointment.id;

    await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_refund', razorpaySignature: 'sig' })
      .expect(200);

    const res = await api
      .post(`/api/v1/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'cancel after paying' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('cancelled');
    expect(res.body.appointment.paymentStatus).toBe('refunded');
    expect(vi.mocked(createRefund)).toHaveBeenCalledWith({ paymentId: 'pay_refund' });
  });

  it('still cancels when the refund call fails, leaving payment paid', async () => {
    const { token } = await registerPatient('apt.refundfail@example.com');
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot: '11:30-12:15' }))
      .expect(201);
    const id = booked.body.appointment.id;

    await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_fail', razorpaySignature: 'sig' })
      .expect(200);

    vi.mocked(createRefund).mockRejectedValueOnce(new Error('razorpay down'));
    const res = await api
      .post(`/api/v1/appointments/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'cancel despite refund failure' });
    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('cancelled');
    expect(res.body.appointment.paymentStatus).toBe('paid');
  });
});

describe('POST /api/v1/razorpay/webhook', () => {
  const webhook = (payload: unknown, signature = 'sig') =>
    api
      .post('/api/v1/razorpay/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(JSON.stringify(payload));

  it('marks an appointment paid on payment.captured with a valid signature', async () => {
    const { token } = await registerPatient('apt.wb1@example.com');
    vi.mocked(createOrder).mockResolvedValueOnce({ id: 'order_wb1', amountPaise: 59900 });
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot: '12:15-13:00' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await webhook({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_wb1', order_id: 'order_wb1' } } },
    });
    expect(res.status).toBe(200);

    const detail = await api.get(`/api/v1/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(detail.body.appointment.paymentStatus).toBe('paid');
    expect(detail.body.appointment.razorpayPaymentId).toBe('pay_wb1');
  });

  it('marks an appointment failed on payment.failed', async () => {
    const { token } = await registerPatient('apt.wb2@example.com');
    vi.mocked(createOrder).mockResolvedValueOnce({ id: 'order_wb2', amountPaise: 59900 });
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot: '14:30-15:15' }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await webhook({
      event: 'payment.failed',
      payload: { payment: { entity: { id: 'pay_wb2', order_id: 'order_wb2' } } },
    });
    expect(res.status).toBe(200);

    const detail = await api.get(`/api/v1/appointments/${id}`).set('Authorization', `Bearer ${token}`);
    expect(detail.body.appointment.paymentStatus).toBe('failed');
  });

  it('rejects a bad signature with 401', async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValueOnce(false);
    const res = await webhook({ event: 'payment.captured' });
    expect(res.status).toBe(401);
  });

  it('no-ops on unrelated events', async () => {
    const res = await webhook({ event: 'order.paid', payload: {} });
    expect(res.status).toBe(200);
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    vi.mocked(verifyWebhookSignature).mockImplementationOnce(() => {
      throw new Error('Razorpay RAZORPAY_WEBHOOK_SECRET is not configured');
    });
    const res = await webhook({ event: 'payment.captured' });
    expect(res.status).toBe(500);
    expect(res.body.error.message).toContain('RAZORPAY_WEBHOOK_SECRET');
  });
});
