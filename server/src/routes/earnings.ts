import { Router } from 'express';
import { and, asc, desc, eq, sql, gte, lte, ilike, count } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { appointments, doctors } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const doctorEarningsRouter = Router();

doctorEarningsRouter.use(requireAuth, requireRole('doctor'));

const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

function periodRange(period: string, from?: string, to?: string) {
  const now = new Date();
  const end = to ? new Date(to + 'T23:59:59Z') : now;
  let start: Date;
  switch (period) {
    case 'week': {
      start = new Date(end);
      start.setDate(start.getDate() - 6);
      break;
    }
    case 'month': {
      start = new Date(end);
      start.setDate(start.getDate() - 29);
      break;
    }
    case 'year': {
      start = new Date(end);
      start.setFullYear(start.getFullYear() - 1);
      break;
    }
    case 'custom': {
      if (!from) {
        start = new Date(end);
        start.setDate(start.getDate() - 29);
      } else {
        start = new Date(from + 'T00:00:00Z');
      }
      break;
    }
    default: {
      start = new Date(end);
      start.setDate(start.getDate() - 29);
    }
  }
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

// --- GET /earnings/summary ---

doctorEarningsRouter.get('/earnings/summary', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const period = (req.query.period as string) || 'month';
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const { start, end } = periodRange(period, from, to);

    const base = and(
      eq(appointments.doctorId, doctor.id),
      gte(appointments.date, start),
      lte(appointments.date, end),
    );

    const [totals] = await db
      .select({
        total: sql<number>`coalesce(sum(case when ${appointments.status} in ('completed') and ${appointments.paymentStatus} in ('paid','pending') then ${appointments.feePaise} else 0 end), 0)`,
        paid: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' and ${appointments.status} = 'completed' then ${appointments.feePaise} else 0 end), 0)`,
        pending: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'pending' and ${appointments.status} = 'upcoming' then ${appointments.feePaise} else 0 end), 0)`,
        refunded: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'refunded' then ${appointments.feePaise} else 0 end), 0)`,
        totalAppointments: count(appointments.id),
        completed: sql<number>`count(*) filter (where ${appointments.status} = 'completed')`,
        cancelled: sql<number>`count(*) filter (where ${appointments.status} = 'cancelled')`,
        noShow: sql<number>`count(*) filter (where ${appointments.status} = 'no_show')`,
      })
      .from(appointments)
      .where(base);

    // comparison: shift the window back by its length
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const duration = endMs - startMs;
    const prevEnd = new Date(startMs - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const prevStartStr = prevStart.toISOString().slice(0, 10);
    const prevEndStr = prevEnd.toISOString().slice(0, 10);

    const [prev] = await db
      .select({
        prevPaid: sql<number>`coalesce(sum(case when ${appointments.paymentStatus} = 'paid' and ${appointments.status} = 'completed' then ${appointments.feePaise} else 0 end), 0)`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          gte(appointments.date, prevStartStr),
          lte(appointments.date, prevEndStr),
        ),
      );

    const prevEarnings = Number(prev?.prevPaid ?? 0);
    const curEarnings = Number(totals.paid);
    const percentChange = prevEarnings > 0 ? Math.round(((curEarnings - prevEarnings) / prevEarnings) * 1000) / 10 : 0;

    res.json({
      summary: {
        totalEarningsPaise: Number(totals.total),
        paidEarningsPaise: curEarnings,
        pendingEarningsPaise: Number(totals.pending),
        netEarningsPaise: curEarnings - Number(totals.refunded),
        refundTotalPaise: Number(totals.refunded),
        appointmentCount: Number(totals.totalAppointments),
        completedCount: Number(totals.completed),
        cancelledCount: Number(totals.cancelled),
        noShowCount: Number(totals.noShow),
      },
      comparison: {
        previousPeriodEarningsPaise: prevEarnings,
        percentChange,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /earnings/chart ---

doctorEarningsRouter.get('/earnings/chart', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const period = (req.query.period as string) || 'month';
    const { start, end } = periodRange(period);

    const rows = await db
      .select({
        date: appointments.date,
        earnings: sql<number>`coalesce(sum(case when ${appointments.status} = 'completed' and ${appointments.paymentStatus} = 'paid' then ${appointments.feePaise} else 0 end), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          gte(appointments.date, start),
          lte(appointments.date, end),
        ),
      )
      .groupBy(appointments.date)
      .orderBy(asc(appointments.date));

    if (period === 'year') {
      // aggregate by month
      const byMonth = new Map<string, { earnings: number; appointments: number }>();
      for (const r of rows) {
        const key = r.date.slice(0, 7); // YYYY-MM
        const existing = byMonth.get(key) ?? { earnings: 0, appointments: 0 };
        existing.earnings += Number(r.earnings);
        existing.appointments += Number(r.count);
        byMonth.set(key, existing);
      }
      // fill in all 12 months
      const dataPoints: Array<{ date: string; earningsPaise: number; appointments: number }> = [];
      const base = new Date(end + 'T00:00:00Z');
      for (let i = 11; i >= 0; i--) {
        const d = new Date(base);
        d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        const agg = byMonth.get(key);
        dataPoints.push({
          date: key + '-01',
          earningsPaise: agg?.earnings ?? 0,
          appointments: agg?.appointments ?? 0,
        });
      }
      res.json({ dataPoints, period });
    } else {
      // fill missing days
      const byDay = new Map<string, { earnings: number; appointments: number }>();
      for (const r of rows) {
        byDay.set(r.date, { earnings: Number(r.earnings), appointments: Number(r.count) });
      }
      const dataPoints: Array<{ date: string; earningsPaise: number; appointments: number }> = [];
      const cur = new Date(start + 'T00:00:00Z');
      const last = new Date(end + 'T00:00:00Z');
      while (cur <= last) {
        const key = cur.toISOString().slice(0, 10);
        const agg = byDay.get(key);
        dataPoints.push({
          date: key,
          earningsPaise: agg?.earnings ?? 0,
          appointments: agg?.appointments ?? 0,
        });
        cur.setDate(cur.getDate() + 1);
      }
      res.json({ dataPoints, period });
    }
  } catch (err) {
    next(err);
  }
});

// --- GET /payments ---

const paymentsQuery = z.object({
  status: z.enum(['paid', 'pending', 'failed', 'refunded']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

doctorEarningsRouter.get('/payments', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const { status, page, limit, search } = paymentsQuery.parse(req.query);
    const filters = [eq(appointments.doctorId, doctor.id)];
    if (status) filters.push(eq(appointments.paymentStatus, status));
    if (search) {
      filters.push(ilike(appointments.patientName, `%${search}%`));
    }

    const where = and(...filters);

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(appointments)
      .where(where);

    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await db
      .select({
        bookingId: appointments.bookingId,
        patientName: appointments.patientName,
        mode: appointments.mode,
        date: appointments.date,
        feePaise: appointments.feePaise,
        paymentStatus: appointments.paymentStatus,
        razorpayPaymentId: appointments.razorpayPaymentId,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(where)
      .orderBy(desc(appointments.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      payments: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
});
