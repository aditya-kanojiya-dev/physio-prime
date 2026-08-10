import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/physio_prime_test',
    },
  },
});
