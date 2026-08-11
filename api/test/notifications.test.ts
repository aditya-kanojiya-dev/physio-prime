import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, notifications } from '../src/db/schema';
import { sendNotification, templates, providers } from '../src/lib/notifications';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));
import { createOrder, createRefund, verifySignature } from '../src/lib/razorpay';

const api = request(createApp());

const DOCTOR = 'doc-tarannum-sayyed';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function futureWeekday(dayOfWeek: number): string {
  const d = new Date();
  let cur = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  while (cur.getDay() !== dayOfWeek) {
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  return `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
}

async function registerPatient(email: string): Promise<{ token: string; id: number }> {
  const res = await api.post('/api/v1/auth/register').send({
    name: 'Test Patient',
    email,
    phone: '9876543210',
    password: 'patient-pass-123',
  });
  expect(res.status).toBe(201);
  return { token: res.body.token, id: res.body.user.id };
}

async function registerAdmin(email: string): Promise<{ token: string }> {
  const { id } = await registerPatient(email);
  await db.execute(`UPDATE users SET role = 'admin' WHERE id = ${id}`);
  const res = await api.post('/api/v1/auth/login').send({ email, password: 'patient-pass-123' });
  expect(res.status).toBe(200);
  return { token: res.body.token };
}

async function bookAndVerify(email: string, slot: string): Promise<{ token: string; bookingId: string }> {
  const { token } = await registerPatient(email);
  const book = await api
    .post('/api/v1/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      doctorSlug: DOCTOR,
      mode: 'online',
      date: futureWeekday(1),
      slot,
      patientName: 'Test Patient',
      patientPhone: '9876543210',
    });
  expect(book.status).toBe(201);
  const bookingId = book.body.appointment.id;
  const verify = await api
    .post(`/api/v1/appointments/${bookingId}/verify`)
    .set('Authorization', `Bearer ${token}`)
    .send({ razorpayPaymentId: 'pay_test', razorpaySignature: 'sig_test' });
  expect(verify.status).toBe(200);
  return { token, bookingId };
}

async function insertPaidAppointmentForTomorrow(patientId: number): Promise<number> {
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR));
  const [row] = await db
    .insert(appointments)
    .values({
      bookingId: `APT-${String(Math.floor(100000 + Math.random() * 900000))}`,
      patientId,
      doctorId: doc.id,
      mode: 'online',
      date: futureDate(1),
      timeSlot: '09:00-09:30',
      status: 'upcoming',
      feePaise: 80000,
      address: {},
      paymentStatus: 'paid',
      razorpayOrderId: 'order_test',
      razorpayPaymentId: 'pay_test',
      patientName: 'Test Patient',
      patientPhone: '9876543210',
    })
    .returning();
  return row.id;
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
  vi.mocked(createOrder).mockImplementation(async ({ amountPaise }) => ({ id: 'order_default', amountPaise }));
  vi.mocked(verifySignature).mockReturnValue(true);
  vi.mocked(createRefund).mockResolvedValue();
  providers.twilioWhatsApp = vi.fn(async () => undefined);
  providers.twilioSms = vi.fn(async () => undefined);
});

describe('sendNotification', () => {
  it('inserts a row and dispatches via the mock provider (status sent)', async () => {
    await sendNotification({ channel: 'whatsapp', to: '9876543210', subject: 'S', body: 'B' });
    const rows = await db.select().from(notifications);
    const row = rows.find((r) => r.toAddress === '9876543210');
    expect(row).toBeDefined();
    expect(row!.status).toBe('sent');
  });

  it('marks the row failed and does not throw when the provider throws', async () => {
    vi.mocked(providers.twilioWhatsApp).mockRejectedValueOnce(new Error('Twilio 500'));
    await expect(sendNotification({ channel: 'whatsapp', to: '9876543211', subject: 'S', body: 'B' })).resolves.toBeUndefined();
    const rows = await db.select().from(notifications);
    const row = rows.find((r) => r.toAddress === '9876543211');
    expect(row).toBeDefined();
    expect(row!.status).toBe('failed');
    expect(row!.error).toContain('Twilio 500');
  });
});

describe('templates', () => {
  const ctx = {
    patientName: 'Priya',
    doctorName: 'Dr. Tarannum Sayyed',
    date: '2026-08-17',
    timeSlot: '10:00-10:30',
    mode: 'online',
    bookingId: 'APT-123456',
  };
  it('render expected subject/body substrings', () => {
    const confirmed = templates.bookingConfirmed({ ...ctx, amountPaise: 80000 });
    expect(confirmed.subject).toContain('Dr. Tarannum Sayyed');
    expect(confirmed.body).toContain('APT-123456');
    expect(confirmed.body).toContain('₹800.00');

    const rescheduled = templates.bookingRescheduled(ctx);
    expect(rescheduled.subject).toContain('rescheduled');
    expect(rescheduled.body).toContain('2026-08-17');

    const cancelled = templates.bookingCancelled({ ...ctx, refunded: true });
    expect(cancelled.subject).toContain('cancelled');
    expect(cancelled.body).toContain('refunded');

    const reminder = templates.appointmentReminder(ctx);
    expect(reminder.subject).toContain('tomorrow');
    expect(reminder.body).toContain('APT-123456');
  });
});

describe('booking flow notifications', () => {
  it('creates a bookingConfirmed whatsapp row when a payment is verified', async () => {
    await bookAndVerify('ntf.confirm@example.com', '10:00-10:30');
    const rows = await db.select().from(notifications);
    const confirmed = rows.filter((r) => r.template === 'confirmed');
    expect(confirmed.length).toBe(1);
    expect(confirmed[0].channel).toBe('whatsapp');
    expect(confirmed[0].status).toBe('sent');
    expect(confirmed[0].body).toContain('confirmed');
  });

  it('creates bookingRescheduled rows on a real change and skips no-op reschedules', async () => {
    const { token, bookingId } = await bookAndVerify('ntf.resched@example.com', '11:00-11:30');
    await api
      .post(`/api/v1/appointments/${bookingId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: futureWeekday(2), slot: '11:00-11:30' })
      .expect(200);
    const rows = await db.select().from(notifications);
    const rescheduled = rows.filter((r) => r.template === 'rescheduled');
    expect(rescheduled.length).toBe(1);
    expect(rescheduled[0].channel).toBe('whatsapp');
    expect(rescheduled[0].body).toContain('moved to');

    await api
      .post(`/api/v1/appointments/${bookingId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: futureWeekday(2), slot: '11:00-11:30' })
      .expect(200);
    const after = await db.select().from(notifications);
    expect(after.filter((r) => r.template === 'rescheduled').length).toBe(1);
  });

  it('creates a bookingCancelled row (with refund note) after cancel', async () => {
    const { token, bookingId } = await bookAndVerify('ntf.cancel@example.com', '12:00-12:30');
    await api
      .post(`/api/v1/appointments/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Changed my mind' })
      .expect(200);
    const rows = await db.select().from(notifications);
    const cancelled = rows.filter((r) => r.template === 'cancelled');
    expect(cancelled.length).toBe(1);
    expect(cancelled[0].channel).toBe('whatsapp');
    expect(cancelled[0].body).toContain('refunded');
  });
});

describe('POST /api/v1/notifications', () => {
  it('send-reminders sends once for a tomorrow paid appointment and dedupes', async () => {
    const admin = await registerAdmin('ntf.admin@example.com');
    const patient = await registerPatient('ntf.remind@example.com');
    const aptId = await insertPaidAppointmentForTomorrow(patient.id);

    const first = await api
      .post('/api/v1/notifications/send-reminders')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(first.status).toBe(200);
    expect(first.body.sent).toBeGreaterThanOrEqual(1);

    const second = await api
      .post('/api/v1/notifications/send-reminders')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(second.status).toBe(200);
    expect(second.body.sent).toBe(0);

    const reminderRows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.template, 'reminder'), eq(notifications.appointmentId, aptId)));
    expect(reminderRows.length).toBe(1);
    expect(reminderRows[0].status).toBe('sent');
  });

  it('GET /notifications requires admin and returns rows newest-first', async () => {
    const patient = await registerPatient('ntf.patient2@example.com');
    const forbidden = await api.get('/api/v1/notifications').set('Authorization', `Bearer ${patient.token}`);
    expect(forbidden.status).toBe(403);

    const admin = await registerAdmin('ntf.admin2@example.com');
    const res = await api.get('/api/v1/notifications').set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    const times = res.body.notifications.map((r: { createdAt: string }) => new Date(r.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('retry re-dispatches a failed row; rejects retrying a non-failed row', async () => {
    vi.mocked(providers.twilioWhatsApp).mockRejectedValueOnce(new Error('Twilio 500'));
    await sendNotification({ channel: 'whatsapp', to: '9876543212', subject: 'S', body: 'B' });
    const rows = await db.select().from(notifications);
    const failed = rows.find((r) => r.toAddress === '9876543212');
    expect(failed!.status).toBe('failed');

    const admin = await registerAdmin('ntf.admin3@example.com');
    const retry = await api
      .post(`/api/v1/notifications/${failed!.id}/retry`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(retry.status).toBe(200);
    expect(retry.body.notification.status).toBe('sent');

    const again = await api
      .post(`/api/v1/notifications/${failed!.id}/retry`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(again.status).toBe(400);
  });
});
