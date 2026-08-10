import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { sql, eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { users, doctorApplications } from '../src/db/schema';
import { createApp } from '../src/index';
import { requireAuth, requireRole } from '../src/middleware/auth';

const api = request(createApp());

const probeApp = express();
probeApp.get('/api/v1/_probe/admin', requireAuth, requireRole('admin'), (_req, res) => {
  res.json({ ok: true });
});
const probeApi = request(probeApp);

beforeAll(async () => {
  await runMigrations();
  await db.execute(
    sql`TRUNCATE users, patient_profiles, doctor_applications RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await db.$client.end();
});

const registerPayload = (overrides: Record<string, unknown> = {}) => ({
  name: 'Asha Rao',
  email: 'asha.reg@example.com',
  phone: '9876543210',
  password: 'patient-pass-123',
  ...overrides,
});

describe('POST /api/v1/auth/register', () => {
  it('registers a patient and stores a bcrypt hash, not plaintext', async () => {
    const res = await api.post('/api/v1/auth/register').send(registerPayload());
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ role: 'patient', name: 'Asha Rao' });

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'asha.reg@example.com'));
    expect(row).toBeDefined();
    expect(row!.passwordHash).not.toBe('patient-pass-123');
    expect(bcrypt.compareSync('patient-pass-123', row!.passwordHash)).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    const payload = registerPayload({ email: 'ravi.dup@example.com', name: 'Ravi' });
    await api.post('/api/v1/auth/register').send(payload).expect(201);
    const res = await api.post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(409);
  });

  it('returns 400 with zod issues for a bad email', async () => {
    const res = await api
      .post('/api/v1/auth/register')
      .send(registerPayload({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(res.body.error.issues).toBeDefined();
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await api
      .post('/api/v1/auth/register')
      .send(registerPayload({ email: 'meera.login@example.com', name: 'Meera' }))
      .expect(201);
    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: 'meera.login@example.com', password: 'patient-pass-123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: 'meera.login@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/apply-doctor', () => {
  it('creates an inactive doctor with a pending application and blocks login', async () => {
    const res = await api.post('/api/v1/auth/apply-doctor').send({
      name: 'Dr Kavita',
      email: 'kavita.doc@example.com',
      phone: '9123456780',
      password: 'doctor-pass-123',
      specialty: 'Orthopedic',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('doctor');

    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'kavita.doc@example.com'));
    expect(row!.role).toBe('doctor');
    expect(row!.status).toBe('inactive');

    const [appRow] = await db
      .select()
      .from(doctorApplications)
      .where(eq(doctorApplications.userId, row!.id));
    expect(appRow?.status).toBe('pending');

    const login = await api
      .post('/api/v1/auth/login')
      .send({ email: 'kavita.doc@example.com', password: 'doctor-pass-123' });
    expect(login.status).toBe(403);
    expect(login.body.error.message).toBe('Account pending approval');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const reg = await api
      .post('/api/v1/auth/register')
      .send(registerPayload({ email: 'nikhil.me@example.com', name: 'Nikhil' }))
      .expect(201);
    const res = await api
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('nikhil.me@example.com');
  });

  it('rejects requests without a token', async () => {
    const res = await api.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await api
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});

describe('requireRole', () => {
  it('forbids a patient token from an admin-only route', async () => {
    const reg = await api
      .post('/api/v1/auth/register')
      .send(registerPayload({ email: 'rahul.probe@example.com', name: 'Rahul' }))
      .expect(201);
    const res = await probeApi
      .get('/api/v1/_probe/admin')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(403);
  });
});
