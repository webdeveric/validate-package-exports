import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    unstubEnvs: true,
    unstubGlobals: true,
    include: ['./src/**/*.test.ts'],
    coverage: {
      include: ['src/**'],
      provider: 'v8',
    },
  },
});
