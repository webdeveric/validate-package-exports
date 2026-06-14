import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { PackageContext, PackageJson } from '@src/types.js';

import { shouldRequire, shouldImport } from './verifyEntryPoint.js';

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

describe('shouldRequire()', () => {
  it('Returns false for esm packages', () => {
    expect(
      shouldRequire({
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: 'require',
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
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
        realDirectory: process.cwd(),
        resolvedPath: process.cwd(),
        realResolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
        itemPath: ['exports', '.', 'import'],
        packageContext,
      }),
    ).toBeTruthy();
  });
});
