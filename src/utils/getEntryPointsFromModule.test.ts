import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint } from '@src/types.js';

import { getEntryPointsFromModule } from './getEntryPointsFromModule.js';

describe('getEntryPointsFromModule()', () => {
  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromModule(
          {
            name: 'test',
            version: '0.0.0',
            module: './module.js',
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
        condition: undefined,
        directory: resolve('/tmp'),
        fileName: 'module.js',
        itemPath: ['module'],
        moduleName: 'test-package',
        packagePath: './package.json',
        packageDirectory: '/tmp',
        relativePath: 'module.js',
        resolvedPath: resolve('/tmp/module.js'),
        subpath: undefined,
        type: 'module',
      } satisfies EntryPoint,
    ]);
  });
});
