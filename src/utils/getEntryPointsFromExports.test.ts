import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';

describe('getEntryPointsFromExports()', () => {
  describe('Gets EntryPoint[] from package.json exports', () => {
    it('Works with ExportsEntryPath', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            name: 'example',
            version: '123.456.789',
            exports: null,
          },
          '/tmp',
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(0);
    });

    it('Works with SubpathExports', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            name: 'example',
            version: '123.456.789',
            exports: {
              '.': [
                {
                  default: './index.js',
                },
                './index.js',
              ],
              './package.json': './package.json',
            },
          },
          '/tmp',
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(3);
    });
  });
});
