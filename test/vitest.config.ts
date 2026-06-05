import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    testTimeout: 60000,
    root: '.',
    include: ['test/**/*.{test,spec}.ts'],
  },
});
