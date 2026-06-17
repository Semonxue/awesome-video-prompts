import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    exclude: [
    'node_modules',
    '.next',
    '.open-next',
    '.kilo',
    'e2e/**',
  ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx', 'scripts/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/middleware.ts',
        'src/app/layout.tsx',
        'src/app/globals.css',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
