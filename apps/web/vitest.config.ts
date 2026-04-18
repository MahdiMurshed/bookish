import { defineConfig } from 'vitest/config';

// Vitest runs unit/integration tests that live next to source under
// src/**/__tests__. Playwright owns e2e/ and uses its own runner, so we
// exclude it here to avoid cross-tool confusion.
export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'playwright-report', 'test-results'],
  },
});
