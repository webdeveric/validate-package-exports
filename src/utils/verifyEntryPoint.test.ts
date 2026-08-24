import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { shouldRequire, shouldImport } from './verifyEntryPoint.js';

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

describe('shouldRequire()', () => {
  it('Returns false for esm packages', () => {
    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext,
      }),
    ).toBeFalsy();

    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: [],
        itemPath: ['exports'],
        packageContext,
      }),
    ).toBeFalsy();
  });

  it('Returns a boolean', () => {
    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext,
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: ['require'],
        itemPath: ['exports', '.', 'require'],
        packageContext,
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: [],
        itemPath: ['exports'],
        packageContext,
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: ['import'],
        itemPath: ['exports', '.', 'import'],
        packageContext,
      }),
    ).toBeFalsy();
  });
});

describe('shouldImport()', () => {
  it('Returns false for cjs packages', () => {
    expect(
      shouldImport({
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext,
      }),
    ).toBeFalsy();
  });

  it('Returns a boolean', () => {
    expect(
      shouldImport({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext,
      }),
    ).toBeTruthy();

    expect(
      shouldImport({
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: ['import'],
        itemPath: ['exports', '.', 'import'],
        packageContext,
      }),
    ).toBeTruthy();

    expect(
      shouldImport({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: ['import'],
        itemPath: ['exports', '.', 'import'],
        packageContext,
      }),
    ).toBeTruthy();
  });
});
