import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { getEntryPointsFromMain } from './getEntryPointsFromMain.js';

describe('getEntryPointsFromMain()', () => {
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

  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromMain(
          {
            ...mockPackageJson,
            main: './main.js',
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'main.js',
        itemPath: ['main'],
        moduleName: mockPackageJson.name,
        relativePath: 'main.js',
        resolvedPath: resolve('/tmp/main.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      } satisfies EntryPoint,
    ]);
  });
});
