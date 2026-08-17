import { Router } from 'express';
import { and, eq, desc, sql, count } from 'drizzle-orm';
import { db } from '../db/pool';
import { doctors, doctorNotifications } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const doctorNotificationsRouter = Router();
doctorNotificationsRouter.use(requireAuth, requireRole('doctor'));

const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

// --- GET /doctor/notifications ---

doctorNotificationsRouter.get('/notifications', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const unreadOnly = req.query.unread === 'true';

    const filters: ReturnType<typeof eq>[] = [eq(doctorNotifications.doctorId, doctor.id)];
    if (unreadOnly) filters.push(eq(doctorNotifications.read, false));

    const where = and(...filters);

    const [totalRow] = await db
      .select({ c: count() })
      .from(doctorNotifications)
      .where(where);

    const total = Number(totalRow?.c ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(doctorNotifications)
      .where(where)
      .orderBy(desc(doctorNotifications.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /doctor/notifications/unread-count ---

doctorNotificationsRouter.get('/notifications/unread-count', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const [result] = await db
      .select({ c: count() })
      .from(doctorNotifications)
      .where(and(eq(doctorNotifications.doctorId, doctor.id), eq(doctorNotifications.read, false)));

    res.json({ count: Number(result?.c ?? 0) });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /doctor/notifications/:id/read ---

doctorNotificationsRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(doctorNotifications)
      .where(and(eq(doctorNotifications.id, id), eq(doctorNotifications.doctorId, doctor.id)));

    if (!existing) {
      res.status(404).json({ error: { message: 'Notification not found' } });
      return;
    }

    const [updated] = await db
      .update(doctorNotifications)
      .set({ read: true })
      .where(eq(doctorNotifications.id, id))
      .returning();

    res.json({
      notification: {
        id: updated.id,
        type: updated.type,
        title: updated.title,
        body: updated.body,
        link: updated.link,
        read: updated.read,
        metadata: updated.metadata,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /doctor/notifications/read-all ---

doctorNotificationsRouter.patch('/notifications/read-all', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const result = await db
      .update(doctorNotifications)
      .set({ read: true })
      .where(and(eq(doctorNotifications.doctorId, doctor.id), eq(doctorNotifications.read, false)));

    res.json({ updated: result.rowCount ?? 0 });
  } catch (err) {
    next(err);
  }
});
