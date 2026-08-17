import { Router } from 'express';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors, doctorPayouts } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const doctorPayoutsRouter = Router();

doctorPayoutsRouter.use(requireAuth, requireRole('doctor'));

const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

async function getAvailableBalance(doctorId: number) {
  const [earned] = await db
    .select({
      total: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' and ${appointments.status} = 'completed' then ${appointments.feePaise} else 0 end), 0)`,
    })
    .from(appointments)
    .where(eq(appointments.doctorId, doctorId));

  const [paidOut] = await db
    .select({
      total: sql<number>`coalesce(sum(case when ${doctorPayouts.status} = 'completed' then ${doctorPayouts.amountPaise} else 0 end), 0)`,
    })
    .from(doctorPayouts)
    .where(eq(doctorPayouts.doctorId, doctorId));

  return Number(earned?.total ?? 0) - Number(paidOut?.total ?? 0);
}

// --- GET /payouts/summary ---

doctorPayoutsRouter.get('/payouts/summary', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const [earned] = await db
      .select({
        total: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' and ${appointments.status} = 'completed' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .where(eq(appointments.doctorId, doctor.id));

    const [paidOut] = await db
      .select({
        total: sql<number>`coalesce(sum(case when ${doctorPayouts.status} = 'completed' then ${doctorPayouts.amountPaise} else 0 end), 0)`,
      })
      .from(doctorPayouts)
      .where(eq(doctorPayouts.doctorId, doctor.id));

    const [pending] = await db
      .select({
        total: sql<number>`coalesce(sum(case when ${doctorPayouts.status} in ('pending', 'processing') then ${doctorPayouts.amountPaise} else 0 end), 0)`,
      })
      .from(doctorPayouts)
      .where(eq(doctorPayouts.doctorId, doctor.id));

    const [lastPayout] = await db
      .select({ createdAt: doctorPayouts.createdAt })
      .from(doctorPayouts)
      .where(and(eq(doctorPayouts.doctorId, doctor.id), eq(doctorPayouts.status, 'completed')))
      .orderBy(sql`${doctorPayouts.createdAt} desc`)
      .limit(1);

    res.json({
      availableBalancePaise: Number(earned?.total ?? 0) - Number(paidOut?.total ?? 0),
      pendingPayoutPaise: Number(pending?.total ?? 0),
      totalPaidPaise: Number(paidOut?.total ?? 0),
      lastPayoutDate: lastPayout?.createdAt?.toISOString().slice(0, 10) ?? null,
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /payouts ---

const payoutsQuery = z.object({
  status: z.enum(['completed', 'pending', 'processing', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

doctorPayoutsRouter.get('/payouts', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const { status, page, limit } = payoutsQuery.parse(req.query);
    const filters = [eq(doctorPayouts.doctorId, doctor.id)];
    if (status) filters.push(eq(doctorPayouts.status, status));

    const where = and(...filters);

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(doctorPayouts)
      .where(where);

    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(doctorPayouts)
      .where(where)
      .orderBy(sql`${doctorPayouts.createdAt} desc`)
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      payouts: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        processedAt: r.processedAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /payouts/request ---

const requestPayoutBody = z.object({
  amountPaise: z.number().int().positive(),
  paymentMethod: z.enum(['bank_transfer', 'upi']),
});

doctorPayoutsRouter.post('/payouts/request', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const { amountPaise, paymentMethod } = requestPayoutBody.parse(req.body);

    const available = await getAvailableBalance(doctor.id);
    if (amountPaise > available) {
      res.status(400).json({ error: { message: 'Insufficient available balance' } });
      return;
    }

    const [payout] = await db
      .insert(doctorPayouts)
      .values({
        doctorId: doctor.id,
        amountPaise,
        paymentMethod,
        status: 'pending',
      })
      .returning();

    res.status(201).json({
      id: payout.id,
      amountPaise: payout.amountPaise,
      status: payout.status,
      paymentMethod: payout.paymentMethod,
      transactionId: payout.transactionId,
      notes: payout.notes,
      createdAt: payout.createdAt.toISOString(),
      processedAt: payout.processedAt?.toISOString() ?? null,
    });
  } catch (err) {
    next(err);
  }
});
