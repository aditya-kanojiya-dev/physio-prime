import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import { notifications } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { dispatch, sendReminderPass } from '../lib/notifications';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth, requireRole('admin'));

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.id))
      .limit(100);
    res.json({ notifications: rows });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post('/send-reminders', async (_req, res, next) => {
  try {
    const sent = await sendReminderPass();
    res.json({ sent });
  } catch (err) {
    next(err);
  }
});

const retrySchema = z.object({
  id: z.coerce.number().int().positive(),
});

notificationsRouter.post('/:id/retry', async (req, res, next) => {
  try {
    const { id } = retrySchema.parse(req.params);
    const [row] = await db.select().from(notifications).where(eq(notifications.id, id));
    if (!row) {
      res.status(404).json({ error: { message: 'Notification not found' } });
      return;
    }
    if (row.status !== 'failed') {
      res.status(400).json({ error: { message: 'Only failed notifications can be retried' } });
      return;
    }
    try {
      await dispatch({ channel: row.channel, toAddress: row.toAddress, subject: row.subject, body: row.body });
      await db.update(notifications).set({ status: 'sent', sentAt: new Date(), error: null }).where(eq(notifications.id, id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.update(notifications).set({ status: 'failed', error: message }).where(eq(notifications.id, id));
      res.status(502).json({ error: { message: 'Retry failed' } });
      return;
    }
    res.json({ notification: (await db.select().from(notifications).where(eq(notifications.id, id)))[0] });
  } catch (err) {
    next(err);
  }
});
