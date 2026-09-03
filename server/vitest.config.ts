import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // tests run against the Supabase Postgres in .env (DATABASE_URL); files truncate
    // + seed the same tables, so they must not run in parallel
    fileParallelism: false,
    // remote DB: generous timeouts, single connection (see pool.ts)
    testTimeout: 15000,
    hookTimeout: 30000,
    env: {
      PG_POOL_MAX: '1',
      // Keep the real middleware mounted without 429ing suites that share one createApp().
      RATE_LIMIT_AUTH_MAX: '10000',
      RATE_LIMIT_API_MAX: '10000',
    },
  },
});
