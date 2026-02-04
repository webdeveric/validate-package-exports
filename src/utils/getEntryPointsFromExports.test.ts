import { resolve } from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import type { EntryPoint } from '@src/types.js';

import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';

describe('getEntryPointsFromExports()', () => {
  describe('Gets EntryPoint[] from package.json exports', () => {
    it('Works with null ExportsEntryPath', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            name: 'example',
            version: '123.456.789',
            exports: null,
          },
          {
            name: 'example',
            type: 'commonjs',
            path: '/tmp/package.json',
            directory: resolve('/tmp'),
          },
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(0);
    });

    it('Works with string ExportsEntryPath', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            name: 'example',
            version: '123.456.789',
            exports: './main.js',
          },
          {
            name: 'example',
            type: 'commonjs',
            path: '/tmp/package.json',
            directory: resolve('/tmp'),
          },
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(1);

      expect(entryPoints.at(0)).toEqual({
        moduleName: 'example',
        packagePath: '/tmp/package.json',
        packageDirectory: resolve('/tmp'),
        type: 'commonjs',
        fileName: 'main.js',
        relativePath: 'main.js',
        directory: resolve('/tmp'),
        resolvedPath: resolve('/tmp/main.js'),
        subpath: '.',
        condition: undefined,
        itemPath: ['exports'],
      } satisfies EntryPoint);
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
          {
            name: 'example',
            type: 'commonjs',
            path: '/tmp/package.json',
            directory: resolve('/tmp'),
          },
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(3);
    });
  });
});
