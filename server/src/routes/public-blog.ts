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

export const publicBlogRouter = Router();

const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

const postQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['newest', 'oldest', 'popular']).default('newest'),
});

async function getPublicPostWithRelations(slug: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')));
  if (!post) return null;
  let category = null;
  if (post.categoryId) {
    [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, post.categoryId));
  }
  const postTags = await db
    .select({ ...getTableColumns(blogTags) })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
    .where(eq(blogPostTags.postId, post.id));
  return { ...post, category, tags: postTags };
}

async function getPublicPostsWithRelations(filters: SQL[], order: SQL, page: number, pageSize: number) {
  const publicFilters = [...filters, eq(blogPosts.status, 'published')];

  const [{ total }] = await db
    .select({ total: count(blogPosts.id) })
    .from(blogPosts)
    .where(and(...publicFilters));

  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(...publicFilters))
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

// --- Categories (public) ---
publicBlogRouter.get('/categories', async (_req, res, next) => {
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

// --- Tags (public) ---
publicBlogRouter.get('/tags', async (_req, res, next) => {
  try {
    const rows = await db.select().from(blogTags).orderBy(asc(blogTags.name));
    res.json({ tags: rows });
  } catch (err) {
    next(err);
  }
});

// --- Posts (public - published only) ---
publicBlogRouter.get('/posts', async (req, res, next) => {
  try {
    const query = postQuerySchema.parse(req.query);
    const filters: SQL[] = [];

    if (query.q) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      filters.push(or(ilike(blogPosts.title, q), ilike(blogPosts.slug, q), ilike(blogPosts.excerpt, q))!);
    }
    if (query.category) {
      const [category] = await db.select({ id: blogCategories.id }).from(blogCategories).where(eq(blogCategories.slug, query.category));
      if (category) {
        filters.push(eq(blogPosts.categoryId, category.id));
      }
    }
    if (query.tag) {
      const [tag] = await db.select({ id: blogTags.id }).from(blogTags).where(eq(blogTags.slug, query.tag));
      if (tag) {
        filters.push(
          sql`EXISTS (SELECT 1 FROM blog_post_tags WHERE blog_post_tags.post_id = blog_posts.id AND blog_post_tags.tag_id = ${tag.id})`
        );
      }
    }

    let order: SQL;
    switch (query.sort) {
      case 'oldest':
        order = asc(blogPosts.publishedAt);
        break;
      case 'popular':
        order = desc(blogPosts.id);
        break;
      default:
        order = desc(blogPosts.publishedAt);
    }

    const { posts, total } = await getPublicPostsWithRelations(filters, order, query.page, query.pageSize);
    res.json({ posts, pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.ceil(total / query.pageSize) } });
  } catch (err) {
    next(err);
  }
});

// --- Single Post by slug ---
publicBlogRouter.get('/posts/:slug', async (req, res, next) => {
  try {
    const slug = slugSchema.parse(req.params.slug);
    const post = await getPublicPostWithRelations(slug);
    if (!post) {
      res.status(404).json({ error: { message: 'Post not found' } });
      return;
    }
    res.json({ post });
  } catch (err) {
    next(err);
  }
});