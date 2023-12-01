import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
    },
  },
});
