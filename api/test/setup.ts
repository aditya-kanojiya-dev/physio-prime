import { vi } from 'vitest';

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
    },
  }),
}));
