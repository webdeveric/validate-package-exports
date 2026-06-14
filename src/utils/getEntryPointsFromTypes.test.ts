import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { getEntryPointsFromTypes } from './getEntryPointsFromTypes.js';

describe('getEntryPointsFromTypes()', () => {
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

  it.each(['types', 'typings'])('types property %s: yields EntryPoint objects', (typesProperty) => {
    expect(
      Array.from(
        getEntryPointsFromTypes(
          {
            ...mockPackageJson,
            [typesProperty]: './types.d.ts',
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: 'types',
        directory: resolve('/tmp'),
        fileName: 'types.d.ts',
        itemPath: [typesProperty],
        moduleName: undefined,
        relativePath: 'types.d.ts',
        resolvedPath: resolve('/tmp/types.d.ts'),
        subpath: undefined,
        type: 'module',
        packageContext,
      } satisfies EntryPoint,
    ]);
  });

  it('Does not yield EntryPoint with package.json is missing a types property', () => {
    expect(
      Array.from(
        getEntryPointsFromTypes(
          {
            name: mockPackageJson.name,
            version: mockPackageJson.version,
          },
          packageContext,
        ),
      ),
    ).toHaveLength(0);
  });
});
