import { resolve } from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';

describe('getEntryPointsFromExports()', () => {
  const mockPackageJson = {
    name: 'mock-package',
    type: 'module',
    version: '0.0.0',
    exports: {
      './path.js': './path.js',
    },
  } satisfies PackageJson;

  const packageContext: PackageContext = {
    name: mockPackageJson.name,
    type: mockPackageJson.type,
    path: resolve('/tmp/package.json'),
    realPath: resolve('/tmp/package.json'),
    directory: resolve('/tmp'),
    realDirectory: resolve('/tmp'),
  };

  describe('Gets EntryPoint[] from package.json exports', () => {
    it('Works with null ExportsEntryPath', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            ...mockPackageJson,
            exports: null,
          },
          packageContext,
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(0);
    });

    it('Works with string ExportsEntryPath', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            ...mockPackageJson,
            exports: './main.js',
          },
          packageContext,
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(1);

      expect(entryPoints.at(0)).toEqual({
        moduleName: mockPackageJson.name,
        type: mockPackageJson.type,
        fileName: 'main.js',
        relativePath: 'main.js',
        directory: resolve('/tmp'),
        resolvedPath: resolve('/tmp/main.js'),
        subpath: '.',
        condition: [],
        itemPath: ['exports'],
        packageContext,
      } satisfies EntryPoint);
    });

    it('Works with SubpathExports', async () => {
      const entryPoints = await Readable.from(
        getEntryPointsFromExports(
          {
            ...mockPackageJson,
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
          packageContext,
        ),
      ).toArray();

      expect(entryPoints).toHaveLength(3);
    });
  });
});
