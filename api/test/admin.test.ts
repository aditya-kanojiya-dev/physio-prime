import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { seed } from '../src/lib/seed';
import { createApp } from '../src/index';
import { appointments, doctors } from '../src/db/schema';
import { registerPatient, registerAdmin } from './helpers';

vi.mock('../src/lib/razorpay', () => ({
  createOrder: vi.fn(),
  verifySignature: vi.fn(),
  createRefund: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));

const api = request(createApp());

const ADMIN_EMAIL = 'admin.test@example.com';
const DOCTOR_SLUG = 'doc-tarannum-sayyed';

let adminToken = '';

beforeAll(async () => {
  await runMigrations();
  await seed();
  const { token } = await registerAdmin(ADMIN_EMAIL);
  adminToken = token;
  const { id } = await registerPatient('admin.apt.patient@example.com');
  const [doc] = await db.select().from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
  await db
    .insert(appointments)
    .values({
      bookingId: 'APT-900001',
      patientId: id,
      doctorId: doc.id,
      mode: 'online',
      date: '2026-08-20',
      timeSlot: '10:00-10:45',
      status: 'completed',
      feePaise: 80000,
      address: {},
      paymentStatus: 'paid',
      patientName: 'Admin Test Patient',
      patientPhone: '9876543210',
    })
    .onConflictDoNothing();
});

afterAll(async () => {
  await db.$client.end();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('admin auth gating', () => {
  it('requires a valid token', async () => {
    const res = await api.get('/api/v1/admin/insights');
    expect(res.status).toBe(401);
  });

  it('rejects patients', async () => {
    const patient = await registerPatient('admin.patient@example.com');
    const res = await api.get('/api/v1/admin/insights').set('Authorization', `Bearer ${patient.token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/admin/insights', () => {
  it('returns aggregates', async () => {
    const res = await api.get('/api/v1/admin/insights').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalBookings).toBeGreaterThan(0);
    expect(res.body.summary.revenuePaise).toBeGreaterThan(0);
    expect(Array.isArray(res.body.bookingsByMode)).toBe(true);
    expect(Array.isArray(res.body.bookingsByDay)).toBe(true);
    expect(Array.isArray(res.body.newPatientsByDay)).toBe(true);
    expect(Array.isArray(res.body.topDoctors)).toBe(true);
  });

  it('filters by date range and rejects bad dates', async () => {
    const ok = await api
      .get('/api/v1/admin/insights?from=2026-08-20&to=2026-08-20')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);

    const bad = await api
      .get('/api/v1/admin/insights?from=2026/08/20')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bad.status).toBe(400);
  });
});

describe('GET /api/v1/admin/doctors + PATCH', () => {
  it('lists all doctors with email', async () => {
    const res = await api.get('/api/v1/admin/doctors').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.doctors.length).toBeGreaterThan(0);
    expect(res.body.doctors[0].email).toBeDefined();
  });

  it('toggles verified/featured and edits fields', async () => {
    const [doc] = await db.select({ id: doctors.id, verified: doctors.verified }).from(doctors).where(eq(doctors.slug, DOCTOR_SLUG));
    const res = await api
      .patch(`/api/v1/admin/doctors/${doc.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true, featured: true, bio: 'Admin edited' });
    expect(res.status).toBe(200);
    expect(res.body.doctor.verified).toBe(true);
    expect(res.body.doctor.bio).toBe('Admin edited');
  });

  it('404s for unknown doctor ids', async () => {
    const res = await api
      .patch('/api/v1/admin/doctors/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/admin/appointments', () => {
  it('lists all with doctor name and pagination', async () => {
    const res = await api.get('/api/v1/admin/appointments').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.appointments.length).toBeGreaterThan(0);
    expect(res.body.appointments[0].doctorName).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('filters by status and rejects bad values', async () => {
    const ok = await api
      .get('/api/v1/admin/appointments?status=completed')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.appointments.every((a: { status: string }) => a.status === 'completed')).toBe(true);

    const bad = await api
      .get('/api/v1/admin/appointments?status=nope')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bad.status).toBe(400);
  });
});

describe('GET /api/v1/admin/patients', () => {
  it('lists patients with appointment counts and search', async () => {
    const res = await api.get('/api/v1/admin/patients').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.patients.length).toBeGreaterThan(0);
    expect(res.body.patients[0].appointmentCount).toBeDefined();

    const searched = await api.get('/api/v1/admin/patients?q=admin').set('Authorization', `Bearer ${adminToken}`);
    expect(searched.status).toBe(200);
    expect(searched.body.patients.length).toBeGreaterThan(0);
  });
});

describe('admin users', () => {
  it('creates a doctor account and patches it', async () => {
    const created = await api
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new.doc@example.com', name: 'New Doctor', role: 'doctor' });
    expect(created.status).toBe(201);
    expect(created.body.user.role).toBe('doctor');

    const patched = await api
      .patch(`/api/v1/admin/users/${created.body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });
    expect(patched.status).toBe(200);
    expect(patched.body.user.status).toBe('inactive');

    const dup = await api
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new.doc@example.com', name: 'Again', role: 'doctor' });
    expect(dup.status).toBe(409);
  });
});

describe('admin categories CRUD', () => {
  it('creates, lists, patches, deletes', async () => {
    const token = adminToken;
    const created = await api
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Category', slug: 'test-category', color: '#123456' });
    expect(created.status).toBe(201);

    const patched = await api
      .patch(`/api/v1/admin/categories/${created.body.category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(patched.status).toBe(200);
    expect(patched.body.category.active).toBe(false);

    const list = await api.get('/api/v1/admin/categories').set('Authorization', `Bearer ${token}`);
    expect(list.body.categories.some((c: { slug: string }) => c.slug === 'test-category')).toBe(true);

    const deleted = await api
      .delete(`/api/v1/admin/categories/${created.body.category.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });
});

describe('admin symptoms CRUD', () => {
  it('creates and deletes a symptom', async () => {
    const token = adminToken;
    const created = await api
      .post('/api/v1/admin/symptoms')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Symptom', slug: 'test-symptom' });
    expect(created.status).toBe(201);

    const deleted = await api
      .delete(`/api/v1/admin/symptoms/${created.body.symptom.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });
});

describe('admin CMS', () => {
  it('upserts and lists content sections', async () => {
    const token = adminToken;
    const put = await api
      .put('/api/v1/admin/cms/home/hero')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: { heading: 'Admin hero' } });
    expect(put.status).toBe(200);

    const list = await api.get('/api/v1/admin/cms').set('Authorization', `Bearer ${token}`);
    expect(list.body.sections.some((s: { key: string }) => s.key === 'hero')).toBe(true);

    const bad = await api.put('/api/v1/admin/cms/other/hero').set('Authorization', `Bearer ${token}`).send({ data: {} });
    expect(bad.status).toBe(400);
  });
});

describe('admin doctor applications', () => {
  it('lists seeded applications', async () => {
    const res = await api.get('/api/v1/admin/doctor-applications').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBeGreaterThan(0);
    expect(res.body.applications[0].email).toBeDefined();
  });
});
