import { Router } from 'express';
import { and, asc, desc, eq, sql, ilike } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import {
  communityCategories,
  communityPosts,
  communityReplies,
  communityVotes,
  doctors,
} from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';

export const communityRouter = Router();

// --- public helpers ---

async function requireDoctor(userId: number) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
  return doctor;
}

// --- GET /community/categories (public) ---

communityRouter.get('/categories', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: communityCategories.id,
        name: communityCategories.name,
        slug: communityCategories.slug,
        description: communityCategories.description,
        icon: communityCategories.icon,
        color: communityCategories.color,
      })
      .from(communityCategories)
      .where(eq(communityCategories.active, true))
      .orderBy(asc(communityCategories.sortOrder));

    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

// --- GET /community/posts/mine (auth required) ---
// Defined BEFORE /posts/:id so it doesn't get swallowed as an :id param

const authRouter = Router();
authRouter.use(requireAuth, requireRole('doctor'));

authRouter.get('/posts/mine', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const rows = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        body: communityPosts.body,
        tags: communityPosts.tags,
        replyCount: communityPosts.replyCount,
        voteCount: communityPosts.voteCount,
        viewCount: communityPosts.viewCount,
        pinned: communityPosts.pinned,
        createdAt: communityPosts.createdAt,
        categoryName: communityCategories.name,
        categorySlug: communityCategories.slug,
      })
      .from(communityPosts)
      .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
      .where(eq(communityPosts.doctorId, doctor.id))
      .orderBy(desc(communityPosts.createdAt));

    res.json({
      posts: rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        tags: r.tags,
        category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug } : null,
        replyCount: r.replyCount,
        voteCount: r.voteCount,
        viewCount: r.viewCount,
        pinned: r.pinned,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /community/posts (auth) ---

const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1),
  categoryId: z.number().int().positive().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

authRouter.post('/posts', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const { title, body, categoryId, tags } = createPostSchema.parse(req.body);

    const [post] = await db
      .insert(communityPosts)
      .values({
        doctorId: doctor.id,
        categoryId: categoryId ?? null,
        title,
        body,
        tags: tags ?? [],
      })
      .returning();

    res.status(201).json({ post: { ...post, createdAt: post.createdAt.toISOString() } });
  } catch (err) {
    next(err);
  }
});

// --- POST /community/posts/:id/replies (auth) ---

const createReplySchema = z.object({
  body: z.string().min(1),
  parentId: z.number().int().positive().optional(),
});

authRouter.post('/posts/:id/replies', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const postId = Number(req.params.id);
    const { body, parentId } = createReplySchema.parse(req.body);

    const [reply] = await db
      .insert(communityReplies)
      .values({
        postId,
        doctorId: doctor.id,
        parentId: parentId ?? null,
        body,
      })
      .returning();

    await db
      .update(communityPosts)
      .set({ replyCount: sql`${communityPosts.replyCount} + 1` })
      .where(eq(communityPosts.id, postId));

    res.status(201).json({ reply: { ...reply, createdAt: reply.createdAt.toISOString() } });
  } catch (err) {
    next(err);
  }
});

// --- POST /community/posts/:id/vote (auth) ---

const voteSchema = z.object({ value: z.literal(1).or(z.literal(-1)) });

authRouter.post('/posts/:id/vote', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const postId = Number(req.params.id);
    const { value } = voteSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(communityVotes)
      .where(and(eq(communityVotes.doctorId, doctor.id), eq(communityVotes.postId, postId)));

    let delta: number = value;

    if (existing) {
      if (existing.value === value) {
        await db.delete(communityVotes).where(eq(communityVotes.id, existing.id));
        delta = -value;
      } else {
        await db.update(communityVotes).set({ value }).where(eq(communityVotes.id, existing.id));
        delta = value * 2;
      }
    } else {
      await db.insert(communityVotes).values({ doctorId: doctor.id, postId, value });
    }

    await db
      .update(communityPosts)
      .set({ voteCount: sql`${communityPosts.voteCount} + ${delta}` })
      .where(eq(communityPosts.id, postId));

    const [updated] = await db
      .select({ voteCount: communityPosts.voteCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    res.json({ voteCount: updated?.voteCount ?? 0 });
  } catch (err) {
    next(err);
  }
});

// --- POST /community/replies/:id/vote (auth) ---

authRouter.post('/replies/:id/vote', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const replyId = Number(req.params.id);
    const { value } = voteSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(communityVotes)
      .where(and(eq(communityVotes.doctorId, doctor.id), eq(communityVotes.replyId, replyId)));

    let delta: number = value;

    if (existing) {
      if (existing.value === value) {
        await db.delete(communityVotes).where(eq(communityVotes.id, existing.id));
        delta = -value;
      } else {
        await db.update(communityVotes).set({ value }).where(eq(communityVotes.id, existing.id));
        delta = value * 2;
      }
    } else {
      await db.insert(communityVotes).values({ doctorId: doctor.id, replyId, value });
    }

    await db
      .update(communityReplies)
      .set({ voteCount: sql`${communityReplies.voteCount} + ${delta}` })
      .where(eq(communityReplies.id, replyId));

    const [updated] = await db
      .select({ voteCount: communityReplies.voteCount })
      .from(communityReplies)
      .where(eq(communityReplies.id, replyId));

    res.json({ voteCount: updated?.voteCount ?? 0 });
  } catch (err) {
    next(err);
  }
});

// --- POST /community/replies/:id/accept (auth, post author only) ---

authRouter.post('/replies/:id/accept', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }

    const replyId = Number(req.params.id);

    const [reply] = await db
      .select({ postId: communityReplies.postId })
      .from(communityReplies)
      .where(eq(communityReplies.id, replyId));

    if (!reply) {
      res.status(404).json({ error: { message: 'Reply not found' } });
      return;
    }

    const [post] = await db
      .select({ doctorId: communityPosts.doctorId })
      .from(communityPosts)
      .where(eq(communityPosts.id, reply.postId));

    if (!post || post.doctorId !== doctor.id) {
      res.status(403).json({ error: { message: 'Only the post author can accept a reply' } });
      return;
    }

    // unset previously accepted
    await db
      .update(communityReplies)
      .set({ accepted: false })
      .where(and(eq(communityReplies.postId, reply.postId), eq(communityReplies.accepted, true)));

    await db
      .update(communityReplies)
      .set({ accepted: true })
      .where(eq(communityReplies.id, replyId));

    res.json({ accepted: true });
  } catch (err) {
    next(err);
  }
});

// mount auth sub-router
communityRouter.use(authRouter);

// --- GET /community/posts (public) ---

const listPostsSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(['new', 'top', 'unanswered']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

communityRouter.get('/posts', async (req, res, next) => {
  try {
    const { category, sort, page, limit, search } = listPostsSchema.parse(req.query);

    const filters = [];
    if (category) {
      filters.push(eq(communityCategories.slug, category));
    }
    if (sort === 'unanswered') {
      filters.push(eq(communityPosts.replyCount, 0));
    }
    if (search) {
      filters.push(ilike(communityPosts.title, `%${search}%`));
    }

    const where = filters.length ? and(...filters) : undefined;

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(communityPosts)
      .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
      .where(where);

    const total = Number(countRow?.total ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;

    const orderCol =
      sort === 'top' ? desc(communityPosts.voteCount) : desc(communityPosts.createdAt);

    const rows = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        body: communityPosts.body,
        tags: communityPosts.tags,
        replyCount: communityPosts.replyCount,
        voteCount: communityPosts.voteCount,
        viewCount: communityPosts.viewCount,
        pinned: communityPosts.pinned,
        createdAt: communityPosts.createdAt,
        categoryName: communityCategories.name,
        categorySlug: communityCategories.slug,
        doctorName: doctors.name,
        doctorSpecialty: doctors.specialty,
        doctorPhoto: doctors.photo,
      })
      .from(communityPosts)
      .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
      .leftJoin(doctors, eq(communityPosts.doctorId, doctors.id))
      .where(where)
      .orderBy(orderCol)
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      posts: rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        tags: r.tags,
        category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug } : null,
        doctor: { name: r.doctorName, specialty: r.doctorSpecialty, photo: r.doctorPhoto },
        replyCount: r.replyCount,
        voteCount: r.voteCount,
        viewCount: r.viewCount,
        pinned: r.pinned,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /community/posts/:id (public, increments viewCount) ---

communityRouter.get('/posts/:id', async (req, res, next) => {
  try {
    const postId = Number(req.params.id);

    const [row] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        body: communityPosts.body,
        tags: communityPosts.tags,
        replyCount: communityPosts.replyCount,
        voteCount: communityPosts.voteCount,
        viewCount: communityPosts.viewCount,
        pinned: communityPosts.pinned,
        createdAt: communityPosts.createdAt,
        categoryName: communityCategories.name,
        categorySlug: communityCategories.slug,
        doctorId: communityPosts.doctorId,
        doctorName: doctors.name,
        doctorSpecialty: doctors.specialty,
        doctorPhoto: doctors.photo,
      })
      .from(communityPosts)
      .leftJoin(communityCategories, eq(communityPosts.categoryId, communityCategories.id))
      .leftJoin(doctors, eq(communityPosts.doctorId, doctors.id))
      .where(eq(communityPosts.id, postId));

    if (!row) {
      res.status(404).json({ error: { message: 'Post not found' } });
      return;
    }

    await db
      .update(communityPosts)
      .set({ viewCount: sql`${communityPosts.viewCount} + 1` })
      .where(eq(communityPosts.id, postId));

    const replyRows = await db
      .select({
        id: communityReplies.id,
        body: communityReplies.body,
        voteCount: communityReplies.voteCount,
        accepted: communityReplies.accepted,
        parentId: communityReplies.parentId,
        createdAt: communityReplies.createdAt,
        doctorName: doctors.name,
        doctorSpecialty: doctors.specialty,
        doctorPhoto: doctors.photo,
      })
      .from(communityReplies)
      .leftJoin(doctors, eq(communityReplies.doctorId, doctors.id))
      .where(eq(communityReplies.postId, postId))
      .orderBy(asc(communityReplies.createdAt));

    // build tree
    const map = new Map<number, any>();
    const roots: any[] = [];
    for (const r of replyRows) {
      const node = {
        id: r.id,
        body: r.body,
        doctor: { name: r.doctorName, specialty: r.doctorSpecialty, photo: r.doctorPhoto },
        voteCount: r.voteCount,
        accepted: r.accepted,
        parentId: r.parentId,
        createdAt: r.createdAt.toISOString(),
        replies: [],
      };
      map.set(r.id, node);
    }
    for (const r of replyRows) {
      const node = map.get(r.id)!;
      if (r.parentId && map.has(r.parentId)) {
        map.get(r.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    // user vote (if logged in)
    let userVote = 0;
    if (req.user) {
      const doctor = await requireDoctor(req.user.id);
      if (doctor) {
        const [vote] = await db
          .select({ value: communityVotes.value })
          .from(communityVotes)
          .where(and(eq(communityVotes.doctorId, doctor.id), eq(communityVotes.postId, postId)));
        userVote = vote?.value ?? 0;
      }
    }

    res.json({
      post: {
        id: row.id,
        title: row.title,
        body: row.body,
        tags: row.tags,
        category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug } : null,
        doctor: { name: row.doctorName, specialty: row.doctorSpecialty, photo: row.doctorPhoto },
        replyCount: row.replyCount,
        voteCount: row.voteCount,
        viewCount: row.viewCount + 1,
        pinned: row.pinned,
        createdAt: row.createdAt.toISOString(),
      },
      replies: roots,
      userVote,
    });
  } catch (err) {
    next(err);
  }
});
