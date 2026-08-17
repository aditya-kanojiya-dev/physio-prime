import { Router } from 'express';
import { and, asc, desc, eq, or, sql, ilike, lt, gt, count } from 'drizzle-orm';
import { db } from '../db/pool';
import { doctors, conversations, messages } from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const doctorMessagesRouter = Router();
doctorMessagesRouter.use(requireAuth, requireRole('doctor'));

const noProfile = { status: 403, message: 'Doctor profile not approved yet' } as const;

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

async function resolveDoctorInfo(doctorId: number) {
  const [doc] = await db
    .select({ id: doctors.id, name: doctors.name, specialty: doctors.specialty, photo: doctors.photo })
    .from(doctors)
    .where(eq(doctors.id, doctorId));
  return doc ?? null;
}

async function verifyParticipant(conversationId: number, doctorId: number) {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));
  if (!conv) return null;
  if (conv.doctor1Id !== doctorId && conv.doctor2Id !== doctorId) return null;
  return conv;
}

// --- GET /doctor/messages/conversations ---

doctorMessagesRouter.get('/messages/conversations', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const rows = await db
      .select()
      .from(conversations)
      .where(or(eq(conversations.doctor1Id, doctor.id), eq(conversations.doctor2Id, doctor.id)))
      .orderBy(desc(conversations.lastMessageAt));

    const results = await Promise.all(
      rows.map(async (conv) => {
        const otherId = conv.doctor1Id === doctor.id ? conv.doctor2Id : conv.doctor1Id;
        const other = await resolveDoctorInfo(otherId);

        const [unread] = await db
          .select({ c: count(messages.id) })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.read, false),
              sql`${messages.senderId} != ${doctor.id}`,
            ),
          );

        return {
          id: conv.id,
          otherDoctor: other,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
          unreadCount: Number(unread?.c ?? 0),
        };
      }),
    );

    res.json({ conversations: results });
  } catch (err) {
    next(err);
  }
});

// --- GET /doctor/messages/conversations/:id ---

doctorMessagesRouter.get('/messages/conversations/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const conversationId = Number(req.params.id);
    const conv = await verifyParticipant(conversationId, doctor.id);
    if (!conv) {
      res.status(404).json({ error: { message: 'Conversation not found' } });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? Number(req.query.before) : undefined;

    const filters = [eq(messages.conversationId, conversationId)];
    if (before) filters.push(lt(messages.id, before));

    const rows = await db
      .select()
      .from(messages)
      .where(and(...filters))
      .orderBy(asc(messages.id))
      .limit(limit);

    res.json({
      messages: rows.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /doctor/messages/conversations ---

doctorMessagesRouter.post('/messages/conversations', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const { toDoctorId, message } = req.body as { toDoctorId?: number; message?: string };
    if (!toDoctorId || !message) {
      res.status(400).json({ error: { message: 'toDoctorId and message required' } });
      return;
    }

    if (toDoctorId === doctor.id) {
      res.status(400).json({ error: { message: 'Cannot message yourself' } });
      return;
    }

    // order-independent lookup
    const d1 = Math.min(doctor.id, toDoctorId);
    const d2 = Math.max(doctor.id, toDoctorId);

    let [existing] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.doctor1Id, d1), eq(conversations.doctor2Id, d2)));

    if (!existing) {
      [existing] = await db
        .insert(conversations)
        .values({ doctor1Id: d1, doctor2Id: d2, lastMessage: message, lastMessageAt: new Date() })
        .returning();
    } else {
      await db
        .update(conversations)
        .set({ lastMessage: message, lastMessageAt: new Date() })
        .where(eq(conversations.id, existing.id));
    }

    const [msg] = await db
      .insert(messages)
      .values({ conversationId: existing.id, senderId: doctor.id, body: message })
      .returning();

    res.status(201).json({
      conversation: { id: existing.id, doctor1Id: d1, doctor2Id: d2 },
      message: { id: msg.id, body: msg.body, createdAt: msg.createdAt.toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /doctor/messages/conversations/:id/replies ---

doctorMessagesRouter.post('/messages/conversations/:id/replies', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const conversationId = Number(req.params.id);
    const conv = await verifyParticipant(conversationId, doctor.id);
    if (!conv) {
      res.status(404).json({ error: { message: 'Conversation not found' } });
      return;
    }

    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: { message: 'message required' } });
      return;
    }

    const [msg] = await db
      .insert(messages)
      .values({ conversationId, senderId: doctor.id, body: message })
      .returning();

    await db
      .update(conversations)
      .set({ lastMessage: message, lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    res.status(201).json({
      message: { id: msg.id, body: msg.body, read: msg.read, createdAt: msg.createdAt.toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /doctor/messages/unread-count ---

doctorMessagesRouter.get('/messages/unread-count', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const [result] = await db
      .select({ c: count(messages.id) })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          or(eq(conversations.doctor1Id, doctor.id), eq(conversations.doctor2Id, doctor.id)),
          eq(messages.read, false),
          sql`${messages.senderId} != ${doctor.id}`,
        ),
      );

    res.json({ count: Number(result?.c ?? 0) });
  } catch (err) {
    next(err);
  }
});

// --- GET /doctor/messages/search-doctors ---

doctorMessagesRouter.get('/messages/search-doctors', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(noProfile.status).json({ error: { message: noProfile.message } });
      return;
    }

    const q = (req.query.q as string) || '';
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    if (!q.trim()) {
      res.json({ doctors: [] });
      return;
    }

    const rows = await db
      .select({ id: doctors.id, name: doctors.name, specialty: doctors.specialty, photo: doctors.photo })
      .from(doctors)
      .where(and(ilike(doctors.name, `%${q}%`), sql`${doctors.id} != ${doctor.id}`))
      .limit(limit);

    res.json({ doctors: rows });
  } catch (err) {
    next(err);
  }
});
