import { Router } from 'express';
import { and, eq, desc, count } from 'drizzle-orm';
import { db } from '../db/pool';
import { adminNotifications } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminNotificationsRouter = Router();
adminNotificationsRouter.use(requireAuth, requireRole('admin'));

// --- GET /admin/notifications ---

adminNotificationsRouter.get('/notifications', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const unreadOnly = req.query.unread === 'true';

    const where = unreadOnly ? eq(adminNotifications.read, false) : undefined;

    const [totalRow] = await db
      .select({ c: count() })
      .from(adminNotifications)
      .where(where);

    const total = Number(totalRow?.c ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(adminNotifications)
      .where(where)
      .orderBy(desc(adminNotifications.createdAt))
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

// --- GET /admin/notifications/unread-count ---

adminNotificationsRouter.get('/notifications/unread-count', async (_req, res, next) => {
  try {
    const [result] = await db
      .select({ c: count() })
      .from(adminNotifications)
      .where(eq(adminNotifications.read, false));

    res.json({ count: Number(result?.c ?? 0) });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /admin/notifications/:id/read ---

adminNotificationsRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.id, id));

    if (!existing) {
      res.status(404).json({ error: { message: 'Notification not found' } });
      return;
    }

    const [updated] = await db
      .update(adminNotifications)
      .set({ read: true })
      .where(eq(adminNotifications.id, id))
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

// --- PATCH /admin/notifications/read-all ---

adminNotificationsRouter.patch('/notifications/read-all', async (_req, res, next) => {
  try {
    const result = await db
      .update(adminNotifications)
      .set({ read: true })
      .where(eq(adminNotifications.read, false));

    res.json({ updated: result.rowCount ?? 0 });
  } catch (err) {
    next(err);
  }
});