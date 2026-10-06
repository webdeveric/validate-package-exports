import { resolve } from 'node:path';
import { Readable } from 'node:stream';

import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Result } from '@lib/Result.js';
import type { EntryPoint, PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { fixSlash } from './fixSlash.js';
import { getEntryPointsFromExports } from './getEntryPointsFromExports.js';

vi.mock('node:fs/promises');

describe('getEntryPointsFromExports()', () => {
  afterEach(() => {
    vol.reset();
  });

  const mockPackageJson = {
    name: 'mock-package',
    type: 'module',
    version: '0.0.0',
    exports: {
      './path.js': './path.js',
    },
  } satisfies PackageJson;

  const packageContext = createPackageContext({
    resolvedPath: resolve('/tmp/package.json'),
    realPath: resolve('/tmp/package.json'),
    packageJson: mockPackageJson,
    rawPackageJson: JSON.stringify(mockPackageJson),
  });

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
      vol.fromJSON({
        [resolve('/tmp/dist/a.js')]: '',
        [resolve('/tmp/dist/b.js')]: '',
      });

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
              './*': './dist/*',
              './internal': null,
              './internal/*': null,
              './utils/internal/*': {
                default: null,
              },
              './package.json': './package.json',
            },
          },
          packageContext,
        ),
      ).toArray();

      expect(entryPoints.filter((item) => item instanceof Result)).toEqual([]);

      expect(
        entryPoints
          .filter((item): item is EntryPoint => !(item instanceof Result))
          .map((item) => [item.subpath, item.relativePath, item.itemPath]),
      ).toEqual([
        ['.', 'index.js', ['exports', '.', 0, 'default']],
        ['.', 'index.js', ['exports', '.', 1]],
        ['./*', fixSlash('dist/a.js'), ['exports', './*']],
        ['./*', fixSlash('dist/b.js'), ['exports', './*']],
        ['./package.json', 'package.json', ['exports', './package.json']],
      ]);
    });
  });
});
