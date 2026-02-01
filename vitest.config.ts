import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'release'],
    coverage: {
      provider: 'v8',
      reporter: ['lcovonly', 'text'],
      include: ['app/**/*.ts'],
      exclude: ['node_modules', 'dist', 'release', '**/*.spec.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
});
