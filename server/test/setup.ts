import '../src/lib/load-env';
import { vi } from 'vitest';

// The suite TRUNCATEs and reseeds users, doctors, categories, symptoms, notifications
// and content_sections (with CASCADE), so it must never touch DATABASE_URL from .env -
// that is production. Point TEST_DATABASE_URL at a throwaway database instead.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. This suite truncates and reseeds tables, so it refuses ' +
      'to run against DATABASE_URL. Create a throwaway Postgres, add its URL to .env as ' +
      'TEST_DATABASE_URL, then run: npx tsx src/db/migrate-cli.ts && npm run db:seed',
  );
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// ponytail: no real Supabase in unit tests. getUser() treats the Bearer token as the
// user's email, so tests can mint a token with `Bearer someone@example.com`. A garbage
// token (no email) resolves to null -> 401. If the middleware ever needs more of the
// Supabase response, extend this shape.
vi.mock('../src/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    auth: {
      getUser: async (token: string) =>
        token.includes('@')
          ? {
              data: {
                user: {
                  email: token,
                  user_metadata: { name: token.split('@')[0].replace(/[._-]/g, ' ') },
                },
              },
              error: null,
            }
          : { data: { user: null }, error: { message: 'invalid token' } },
      admin: {
        createUser: vi.fn(async () => ({ data: { user: { id: 'u-test' } }, error: null })),
      },
    },
  }),
}));
