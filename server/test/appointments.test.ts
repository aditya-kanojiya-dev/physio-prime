import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { doctors } from '../src/db/schema';
import { getAvailableWindows } from '../src/lib/slots';
import { futureWeekday, nowHHmm, pickSlot, registerPatient, todayStr } from './helpers';

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

const MONDAY = futureWeekday(1);
const SUNDAY = futureWeekday(0);

const bookPayload = (overrides: Record<string, unknown> = {}) => ({
  doctorSlug: DOCTOR,
  mode: 'online',
  date: MONDAY,
  slot: 'HH:MM-HH:MM',
  symptom: 'Knee pain',
  patientName: 'Test Patient',
  patientPhone: '9876543210',
  ...overrides,
});

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
    const slot = await pickSlot(MONDAY, DOCTOR);

    const res = await api.post('/api/v1/appointments').set('Authorization', `Bearer ${token}`).send(bookPayload({ slot }));
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
    const slot = await pickSlot(MONDAY, DOCTOR);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot, patientGender: 'female', patientAge: 29, patientWeight: 58.5, patientHeight: 165 }));
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
    const slot = await pickSlot(MONDAY, DOCTOR);
    await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }))
      .expect(201);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/appointments validation', () => {
  it('returns 404 for an unknown doctor', async () => {
    const { token } = await registerPatient('apt.baddoc@example.com');
    const slot = await pickSlot(MONDAY, DOCTOR);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: 'not-a-doctor', slot }));
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
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, mode: 'clinic' }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/doctors/:slug/slots', () => {
  it('returns the weekday windows with labels, capacities and HH:MM times', async () => {
    const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR));
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${MONDAY}`);
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(MONDAY);
    expect(res.body.windows).toEqual(await getAvailableWindows(doc!.id, MONDAY));
    for (const w of res.body.windows) {
      expect(w.start).toMatch(/^\d{2}:\d{2}$/);
      expect(w.end).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof w.maxPatients).toBe('number');
      expect(typeof w.bookedCount).toBe('number');
      expect(typeof w.available).toBe('boolean');
    }
    expect(res.body.windows[0]).toMatchObject({ start: '07:00', end: '09:00', label: 'Early Morning' });
  });

  it('returns an empty list on Sunday', async () => {
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${SUNDAY}`);
    expect(res.status).toBe(200);
    expect(res.body.windows).toEqual([]);
  });

  it('hides windows that already ended when the date is today', async () => {
    const before = nowHHmm();
    const res = await api.get(`/api/v1/doctors/${DOCTOR}/slots?date=${todayStr()}`);
    expect(res.status).toBe(200);
    for (const w of res.body.windows as { end: string }[]) {
      expect(w.end > before).toBe(true);
    }
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
    const slot = await pickSlot(MONDAY, DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }))
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
    const slot = await pickSlot(MONDAY, DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }))
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
    const slot = await pickSlot(MONDAY, DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }))
      .expect(201);
    const id = booked.body.appointment.id;

    await api
      .post(`/api/v1/appointments/${id}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ razorpayPaymentId: 'pay_vc', razorpaySignature: 'sig' })
      .expect(200);

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

  it('stores patientRelation when booking for someone else', async () => {
    const { token } = await registerPatient('apt.forother@example.com');
    const slot = await pickSlot(MONDAY, DOCTOR);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot, patientRelation: 'Mother' }));
    expect(res.status).toBe(201);
    expect(res.body.appointment.patientRelation).toBe('Mother');
  });

  it('stores no relation when booking for self', async () => {
    const { token } = await registerPatient('apt.forself@example.com');
    const slot = await pickSlot(MONDAY, DOCTOR);
    const res = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }));
    expect(res.status).toBe(201);
    expect(res.body.appointment.patientRelation).toBeNull();
  });
});

describe('POST /api/v1/appointments/:id/reschedule', () => {
  it('reschedules to a free slot, 409 on a taken slot, 400 on a cancelled appointment', async () => {
    const { token } = await registerPatient('apt.reschedule@example.com');
    const takenSlot = await pickSlot(MONDAY, DOCTOR);
    const taken = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: takenSlot }))
      .expect(201);

    const bookedSlot = await pickSlot(MONDAY, DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot: bookedSlot }))
      .expect(201);
    const id = booked.body.appointment.id;

    const freeSlot = await pickSlot(MONDAY, DOCTOR);
    const ok = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: freeSlot });
    expect(ok.status).toBe(200);
    expect(ok.body.appointment.timeSlot).toBe(freeSlot);

    const conflict = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: takenSlot });
    expect(conflict.status).toBe(409);

    await api
      .post(`/api/v1/appointments/${taken.body.appointment.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'changed mind' })
      .expect(200);

    const cancelled = await api
      .post(`/api/v1/appointments/${taken.body.appointment.id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot: takenSlot });
    expect(cancelled.status).toBe(400);
  });

  it('returns 200 unchanged when rescheduling to the identical date+slot', async () => {
    const { token } = await registerPatient('apt.noop@example.com');
    const slot = await pickSlot(MONDAY, DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ slot }))
      .expect(201);
    const id = booked.body.appointment.id;

    const res = await api
      .post(`/api/v1/appointments/${id}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: MONDAY, slot });
    expect(res.status).toBe(200);
    expect(res.body.appointment.date).toBe(MONDAY);
    expect(res.body.appointment.timeSlot).toBe(slot);
  });
});

describe('POST /api/v1/appointments/:id/cancel', () => {
  it('cancels a pending appointment and keeps payment pending', async () => {
    const { token } = await registerPatient('apt.cancel@example.com');
    const slot = await pickSlot(MONDAY, SECOND_DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot }))
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

  it('cancels a paid appointment without refunding (non-refundable per terms)', async () => {
    const { token } = await registerPatient('apt.refund@example.com');
    const slot = await pickSlot(MONDAY, SECOND_DOCTOR);
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot }))
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
    expect(res.body.appointment.paymentStatus).toBe('paid');
    expect(vi.mocked(createRefund)).not.toHaveBeenCalled();
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
    const slot = await pickSlot(MONDAY, SECOND_DOCTOR);
    vi.mocked(createOrder).mockResolvedValueOnce({ id: 'order_wb1', amountPaise: 59900 });
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot }))
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
    const slot = await pickSlot(MONDAY, SECOND_DOCTOR);
    vi.mocked(createOrder).mockResolvedValueOnce({ id: 'order_wb2', amountPaise: 59900 });
    const booked = await api
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send(bookPayload({ doctorSlug: SECOND_DOCTOR, slot }))
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