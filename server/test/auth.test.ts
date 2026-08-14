import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { sql, eq } from 'drizzle-orm';
import { db } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { users, patientProfiles } from '../src/db/schema';
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
  await db.execute(sql`TRUNCATE users, patient_profiles, doctor_applications RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await db.$client.end();
});

describe('GET /api/v1/auth/me', () => {
  it('auto-creates the user row on first request and returns it', async () => {
    const email = 'nikhil.me@example.com';
    const res = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, role: 'patient', name: 'nikhil me' });

    const [row] = await db.select().from(users).where(eq(users.email, email));
    expect(row).toBeDefined();
  });

  it('returns the same id on a second request (no duplicate row)', async () => {
    const email = 'asha.me@example.com';
    const first = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    const second = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    expect(first.body.user.id).toBe(second.body.user.id);
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

describe('PATCH /api/v1/auth/me', () => {
  it('updates name and phone for the authenticated user', async () => {
    const email = 'edit.me@example.com';
    const res = await api
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${email}`)
      .send({ name: 'Edited Name', phone: '+91 90000 00000' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, name: 'Edited Name', phone: '+91 90000 00000' });

    const [row] = await db.select().from(users).where(eq(users.email, email));
    expect(row?.name).toBe('Edited Name');
    expect(row?.phone).toBe('+91 90000 00000');
  });

  it('clears phone when sent as null', async () => {
    const email = 'clearphone.me@example.com';
    await api
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${email}`)
      .send({ phone: '123' });
    const res = await api
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${email}`)
      .send({ phone: null });
    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBeNull();
  });

  it('rejects an empty payload', async () => {
    const res = await api
      .patch('/api/v1/auth/me')
      .set('Authorization', 'Bearer empty.me@example.com')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects requests without a token', async () => {
    const res = await api.patch('/api/v1/auth/me').send({ name: 'No Auth' });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/auth/me profile fields', () => {
  it('upserts gender/dob/weight/height/address into patient_profiles', async () => {
    const email = 'profile.edit@example.com';
    const res = await api
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${email}`)
      .send({ gender: 'female', dob: '1990-05-14', weight: 55, height: 162, address: { text: 'Nagpur' } });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email, gender: 'female', dob: '1990-05-14', address: { text: 'Nagpur' } });

    const [row] = await db.select().from(patientProfiles).where(eq(patientProfiles.userId, res.body.user.id));
    expect(row).toBeDefined();
    expect(row?.gender).toBe('female');
    expect(String(row?.weight)).toBe('55');
  });

  it('returns profile fields on GET /me and keeps them across a name-only patch', async () => {
    const email = 'profile.get@example.com';
    await api.patch('/api/v1/auth/me').set('Authorization', `Bearer ${email}`).send({ weight: 60 });
    const res = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    expect(res.status).toBe(200);
    expect(res.body.user.weight).toBe('60');

    await api.patch('/api/v1/auth/me').set('Authorization', `Bearer ${email}`).send({ name: 'Profile Person' });
    const after = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    expect(after.body.user.name).toBe('Profile Person');
    expect(after.body.user.weight).toBe('60');
  });

  it('clears a profile field when sent as null', async () => {
    const email = 'profile.clear@example.com';
    await api.patch('/api/v1/auth/me').set('Authorization', `Bearer ${email}`).send({ dob: '1995-01-01' });
    const res = await api
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${email}`)
      .send({ dob: null });
    expect(res.status).toBe(200);
    expect(res.body.user.dob).toBeNull();
  });
});

describe('removed endpoints', () => {
  it('register/login/google/apply-doctor are gone (404)', async () => {
    await api.post('/api/v1/auth/register').send({}).expect(404);
    await api.post('/api/v1/auth/login').send({}).expect(404);
    await api.post('/api/v1/auth/google').send({}).expect(404);
    await api.post('/api/v1/auth/apply-doctor').send({}).expect(404);
  });
});

describe('requireRole', () => {
  it('forbids a patient token from an admin-only route', async () => {
    const res = await probeApi
      .get('/api/v1/_probe/admin')
      .set('Authorization', 'Bearer rahul.probe@example.com');
    expect(res.status).toBe(403);
  });

  it('allows an admin token on an admin-only route', async () => {
    const email = 'admin.probe@example.com';
    await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${email}`);
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
    const res = await probeApi
      .get('/api/v1/_probe/admin')
      .set('Authorization', `Bearer ${email}`);
    expect(res.status).toBe(200);
  });
});
