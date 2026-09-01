import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors, users } from '../src/db/schema';
import { computeCommission } from '../src/lib/commission';
import { registerAdmin, registerPatient } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

const api = request(createApp());

const FEE_PAISE = 80000;
const FEE_PERCENT = 30;
const NET_PAISE = computeCommission(FEE_PAISE, FEE_PERCENT).doctorEarningsPaise;

let doctorToken: string;
let doctorId: number;
let adminToken: string;
let patientId: number;

beforeAll(async () => {
  await runMigrations();
  await seed();

  const doctor = await registerPatient('payout.doctor@example.com');
  await db.update(users).set({ role: 'doctor' }).where(eq(users.id, doctor.id));
  const [doc] = await db
    .insert(doctors)
    .values({ userId: doctor.id, name: 'Payout Test Doc', slug: 'doc-payout-test', platformFeePercent: FEE_PERCENT })
    .returning({ id: doctors.id });
  doctorId = doc.id;
  doctorToken = doctor.token;

  adminToken = (await registerAdmin('payout.admin@example.com')).token;

  const patient = await registerPatient('payout.patient@example.com');
  patientId = patient.id;

  await db.insert(appointments).values({
    bookingId: 'APT-PAYOUT-TEST',
    patientId,
    doctorId,
    mode: 'online',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '10:00-10:30',
    status: 'completed',
    feePaise: FEE_PAISE,
    address: {},
    paymentStatus: 'paid',
    patientName: 'Payout Test Patient',
    patientPhone: '9876543210',
  });
});

afterAll(async () => {
  await db.$client.end();
});

const doctorGet = (path: string) => api.get(path).set('Authorization', `Bearer ${doctorToken}`);
const adminPatch = (path: string, body: Record<string, unknown>) =>
  api.patch(path).set('Authorization', `Bearer ${adminToken}`).send(body);

describe('H3 — net (not gross) earnings + payout balance agree', () => {
  it('reports the doctor net share minus platform fee', async () => {
    const res = await doctorGet('/api/v1/doctor/earnings/summary?period=month');
    expect(res.status).toBe(200);
    expect(res.body.summary.paidEarningsPaise).toBe(NET_PAISE);
    expect(res.body.summary.paidEarningsPaise).not.toBe(FEE_PAISE);
    expect(res.body.summary.totalEarningsPaise).toBe(NET_PAISE);
  });

  it('payout balance equals the same net figure', async () => {
    const res = await doctorGet('/api/v1/doctor/payouts/summary');
    expect(res.status).toBe(200);
    expect(res.body.availableBalancePaise).toBe(NET_PAISE);
    expect(res.body.totalPaidPaise).toBe(0);
  });
});

describe('H4 — payout request + admin completion are safe', () => {
  let payoutId: number;

  it('rejects a request above the (net) available balance', async () => {
    const res = await api
      .post('/api/v1/doctor/payouts/request')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ amountPaise: NET_PAISE + 100, paymentMethod: 'bank_transfer' });
    expect(res.status).toBe(400);
  });

  it('reserves the balance while a payout is pending', async () => {
    const res = await api
      .post('/api/v1/doctor/payouts/request')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ amountPaise: NET_PAISE, paymentMethod: 'bank_transfer' });
    expect(res.status).toBe(201);
    payoutId = res.body.id;

    const summary = await doctorGet('/api/v1/doctor/payouts/summary');
    expect(summary.body.availableBalancePaise).toBe(0);
    expect(summary.body.pendingPayoutPaise).toBe(NET_PAISE);

    const again = await api
      .post('/api/v1/doctor/payouts/request')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ amountPaise: 1000, paymentMethod: 'upi' });
    expect(again.status).toBe(400);
  });

  it('requires processing before completing, then requires a transactionId', async () => {
    const skip = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'completed' });
    expect(skip.status).toBe(400);

    const process = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'processing' });
    expect(process.status).toBe(200);

    const noTx = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'completed' });
    expect(noTx.status).toBe(400);

    const blankTx = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'completed', transactionId: '   ' });
    expect(blankTx.status).toBe(400);
  });

  it('completes with a real transactionId and then locks the payout', async () => {
    const done = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'completed', transactionId: 'UTRI1234567890' });
    expect(done.status).toBe(200);
    expect(done.body.payout.status).toBe('completed');
    expect(done.body.payout.transactionId).toBe('UTRI1234567890');

    const redo = await adminPatch(`/api/v1/admin/payouts/${payoutId}`, { status: 'failed' });
    expect(redo.status).toBe(400);
  });
});