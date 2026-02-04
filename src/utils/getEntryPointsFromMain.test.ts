import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint } from '@src/types.js';

import { getEntryPointsFromMain } from './getEntryPointsFromMain.js';

describe('getEntryPointsFromMain()', () => {
  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromMain(
          {
            name: 'test',
            version: '0.0.0',
            main: './main.js',
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
        fileName: 'main.js',
        itemPath: ['main'],
        moduleName: 'test-package',
        packagePath: './package.json',
        packageDirectory: '/tmp',
        relativePath: 'main.js',
        resolvedPath: resolve('/tmp/main.js'),
        subpath: undefined,
        type: 'module',
      } satisfies EntryPoint,
    ]);
  });
});
