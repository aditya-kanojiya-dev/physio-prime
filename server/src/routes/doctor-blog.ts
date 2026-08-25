import { Router } from 'express';
import { and, asc, count, desc, eq, getTableColumns, ilike, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/pool';
import {
  blogCategories,
  blogPosts,
  blogPostTags,
  blogTags,
} from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireDoctor } from '../lib/doctor';

export const doctorBlogRouter = Router();

doctorBlogRouter.use(requireAuth, requireRole('doctor'));

const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  featuredImage: z.string().url().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

const postQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
});

// Helper to get post with category and tags for a doctor
async function getDoctorPostWithRelations(doctorId: number, id: number) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.authorType, 'doctor'), eq(blogPosts.authorId, doctorId)));
  if (!post) return null;
  let category = null;
  if (post.categoryId) {
    [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, post.categoryId));
  }
  const postTags = await db
    .select({ ...getTableColumns(blogTags) })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
    .where(eq(blogPostTags.postId, id));
  return { ...post, category, tags: postTags };
}

async function getDoctorPostsWithRelations(doctorId: number, filters: SQL[], order: SQL, page: number, pageSize: number) {
  const doctorFilters = [...filters, eq(blogPosts.authorType, 'doctor'), eq(blogPosts.authorId, doctorId)];

  const [{ total }] = await db
    .select({ total: count(blogPosts.id) })
    .from(blogPosts)
    .where(and(...doctorFilters));

  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(...doctorFilters))
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const postIds = rows.map((r: typeof blogPosts.$inferSelect) => r.id);
  let categoriesMap: Record<number, typeof blogCategories.$inferSelect> = {};
  let tagsMap: Record<number, (typeof blogTags.$inferSelect)[]> = {};

  if (postIds.length > 0) {
    const categories = await db
      .select()
      .from(blogCategories)
      .where(sql`${blogCategories.id} IN (${sql.join(rows.filter((r: typeof blogPosts.$inferSelect) => r.categoryId).map((r: typeof blogPosts.$inferSelect) => sql`${r.categoryId}`), sql`, `)})`);
    for (const c of categories) categoriesMap[c.id] = c;

    const postTags = await db
      .select({ postId: blogPostTags.postId, ...getTableColumns(blogTags) })
      .from(blogPostTags)
      .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(sql`${blogPostTags.postId} IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const pt of postTags) {
      if (!tagsMap[pt.postId]) tagsMap[pt.postId] = [];
      tagsMap[pt.postId].push(pt as typeof blogTags.$inferSelect);
    }
  }

  const posts = rows.map((r: typeof blogPosts.$inferSelect) => ({
    ...r,
    category: r.categoryId ? categoriesMap[r.categoryId] : null,
    tags: tagsMap[r.id] || [],
  }));

  return { posts, total: Number(total) };
}

// --- Categories (read-only for doctors) ---
doctorBlogRouter.get('/categories', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(blogCategories)
      .where(eq(blogCategories.active, true))
      .orderBy(asc(blogCategories.sortOrder), asc(blogCategories.id));
    res.json({ categories: rows });
  } catch (err) {
    next(err);
  }
});

// --- Tags (read-only for doctors) ---
doctorBlogRouter.get('/tags', async (_req, res, next) => {
  try {
    const rows = await db.select().from(blogTags).orderBy(asc(blogTags.name));
    res.json({ tags: rows });
  } catch (err) {
    next(err);
  }
});

// --- Posts ---
doctorBlogRouter.get('/posts', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }
    const query = postQuerySchema.parse(req.query);
    const filters: SQL[] = [];

    if (query.q) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      filters.push(or(ilike(blogPosts.title, q), ilike(blogPosts.slug, q), ilike(blogPosts.excerpt, q))!);
    }
    if (query.status) filters.push(eq(blogPosts.status, query.status));
    if (query.categoryId) filters.push(eq(blogPosts.categoryId, query.categoryId));

    let order: SQL;
    switch (query.sort) {
      case 'oldest':
        order = asc(blogPosts.createdAt);
        break;
      case 'title':
        order = asc(blogPosts.title);
        break;
      default:
        order = desc(blogPosts.createdAt);
    }

    const { posts, total } = await getDoctorPostsWithRelations(doctor.id, filters, order, query.page, query.pageSize);
    res.json({ posts, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.ceil(total / query.pageSize) } });
  } catch (err) {
    next(err);
  }
});

doctorBlogRouter.get('/posts/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const post = await getDoctorPostWithRelations(doctor.id, id);
    if (!post) {
      res.status(404).json({ error: { message: 'Post not found' } });
      return;
    }
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

doctorBlogRouter.post('/posts', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }
    const body = postSchema.parse(req.body);
    const { tagIds, ...postData } = body;
    const now = new Date();
    const dataToInsert = {
      ...postData,
      authorType: 'doctor' as const,
      authorId: doctor.id,
      publishedAt: postData.status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    const [created] = await db.insert(blogPosts).values(dataToInsert).returning();
    if (tagIds && tagIds.length > 0) {
      await db.insert(blogPostTags).values(tagIds.map((tagId) => ({ postId: created.id, tagId })));
    }
    res.status(201).json({ post: created });
  } catch (err) {
    next(err);
  }
});

doctorBlogRouter.patch('/posts/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const body = postSchema.partial().parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: { message: 'Nothing to update' } });
      return;
    }
    const { tagIds, ...postData } = body;
    const dataToUpdate: Record<string, unknown> = {
      ...postData,
      updatedAt: new Date(),
    };
    if (postData.status === 'published') {
      dataToUpdate.publishedAt = new Date();
    } else if (postData.status === 'draft') {
      dataToUpdate.publishedAt = null;
    }
    const [updated] = await db
      .update(blogPosts)
      .set(dataToUpdate)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.authorType, 'doctor'), eq(blogPosts.authorId, doctor.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: { message: 'Post not found' } });
      return;
    }
    if (tagIds !== undefined) {
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
      if (tagIds.length > 0) {
        await db.insert(blogPostTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
      }
    }
    res.json({ post: updated });
  } catch (err) {
    next(err);
  }
});

doctorBlogRouter.delete('/posts/:id', async (req, res, next) => {
  try {
    const doctor = await requireDoctor(req.user!.id);
    if (!doctor) {
      res.status(403).json({ error: { message: 'Doctor profile not found' } });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: { message: 'id must be an integer' } });
      return;
    }
    const deleted = await db
      .delete(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.authorType, 'doctor'), eq(blogPosts.authorId, doctor.id)))
      .returning({ id: blogPosts.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: { message: 'Post not found' } });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});