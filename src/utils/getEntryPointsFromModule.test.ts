import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { getEntryPointsFromModule } from './getEntryPointsFromModule.js';

describe('getEntryPointsFromModule()', () => {
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

  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromModule(
          {
            ...mockPackageJson,
            module: './module.js',
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'module.js',
        itemPath: ['module'],
        moduleName: mockPackageJson.name,
        relativePath: 'module.js',
        resolvedPath: resolve('/tmp/module.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      } satisfies EntryPoint,
    ]);
  });
});
