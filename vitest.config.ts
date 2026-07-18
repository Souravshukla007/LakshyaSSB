import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Standalone Vitest configuration for the offline-support test suite.
//
// This config is intentionally decoupled from the Next.js production build:
// it does NOT import next.config.ts, does NOT register any Next/Turbopack/
// webpack bundler plugin, and is only consumed by `vitest` (the `test` and
// `test:watch` npm scripts). `next build` never reads this file, so adding
// dev-only test tooling cannot affect the production bundle.
//
// The environment is ESM/TS-native (Vitest transpiles TS on the fly via esbuild)
// and Node-based, which is all the pure helper / property-based tests
// (Properties 1-7) require. IndexedDB-dependent tests supply `fake-indexeddb`
// themselves via an import in the test file.
export default defineConfig({
  // Map the project's '@/*' tsconfig path alias to the repo root so tests can
  // import modules the same way app code does (e.g. '@/lib/offline/...').
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    // Node environment: the offline helpers under test are framework-free and
    // do not need a DOM. Tests that need IndexedDB pull in `fake-indexeddb`.
    environment: 'node',
    // Allow describe/it/expect without explicit imports in test files.
    globals: true,
    // Only pick up dedicated test files; never traverse build output or native
    // project folders.
    include: ['**/*.{test,spec}.{ts,tsx,js,mjs}'],
    exclude: ['node_modules', '.next', 'android', 'dist', 'out'],
  },
});
