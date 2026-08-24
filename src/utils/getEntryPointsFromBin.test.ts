import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { getEntryPointsFromBin } from './getEntryPointsFromBin.js';

describe('getEntryPointsFromBin()', () => {
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
        getEntryPointsFromBin(
          {
            ...mockPackageJson,
            bin: './bin.js',
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'bin.js',
        itemPath: ['bin'],
        moduleName: undefined,
        relativePath: 'bin.js',
        resolvedPath: resolve('/tmp/bin.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      },
    ] satisfies EntryPoint[]);

    expect(
      Array.from(
        getEntryPointsFromBin(
          {
            name: 'test',
            version: '0.0.0',
            bin: {
              tool: './tool.js',
              example: './example.js',
            },
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'tool.js',
        itemPath: ['bin', 'tool'],
        moduleName: undefined,
        relativePath: 'tool.js',
        resolvedPath: resolve('/tmp/tool.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      },
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'example.js',
        itemPath: ['bin', 'example'],
        moduleName: undefined,
        relativePath: 'example.js',
        resolvedPath: resolve('/tmp/example.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      },
    ] satisfies EntryPoint[]);
  });
});
