import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['specs/**/*.spec.ts'],
    globals: true,
    setupFiles: ['fake-indexeddb/auto'],
  },
});
