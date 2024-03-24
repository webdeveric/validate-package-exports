import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    unstubEnvs: true,
    unstubGlobals: true,
    include: ['./src/**/*.test.ts'],
    coverage: {
      all: false,
      provider: 'v8',
    },
  },
});
