import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // integration tests share one Postgres DB (physio_prime_test); files truncate
    // + seed the same tables, so they must not run in parallel
    fileParallelism: false,
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/physio_prime_test',
    },
  },
});
