import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getEntryPointsFromTypes } from './getEntryPointsFromTypes.js';

describe('getEntryPointsFromTypes()', () => {
  it.each(['types', 'typings'])('types property %s: yields EntryPoint objects', typesProperty => {
    expect(
      Array.from(
        getEntryPointsFromTypes(
          {
            name: 'test',
            version: '0.0.0',
            [typesProperty]: './types.d.ts',
          },
          {
            name: 'test-package',
            type: 'module',
            path: './package.json',
            directory: '/tmp',
          },
        ),
      ),
    ).toEqual([
      {
        condition: 'types',
        directory: resolve('/tmp'),
        fileName: 'types.d.ts',
        itemPath: [typesProperty],
        moduleName: undefined,
        packagePath: './package.json',
        relativePath: 'types.d.ts',
        resolvedPath: resolve('/tmp/types.d.ts'),
        subpath: undefined,
        type: 'module',
      },
    ]);
  });

  it('Does not yield EntryPoint with package.json is missing a types property', () => {
    expect(
      Array.from(
        getEntryPointsFromTypes(
          {
            name: 'test',
            version: '0.0.0',
          },
          {
            name: 'test-package',
            type: 'module',
            path: './package.json',
            directory: '/tmp',
          },
        ),
      ),
    ).toHaveLength(0);
  });
});
