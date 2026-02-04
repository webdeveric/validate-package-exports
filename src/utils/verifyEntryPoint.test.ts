import { describe, expect, it } from 'vitest';

import { shouldRequire, shouldImport } from './verifyEntryPoint.js';

describe('shouldRequire()', () => {
  it('Returns false for esm packages', () => {
    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
        itemPath: ['main'],
      }),
    ).toBeFalsy();

    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: undefined,
        itemPath: ['exports'],
      }),
    ).toBeFalsy();
  });

  it('Returns a boolean', () => {
    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
        itemPath: ['main'],
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: 'require',
        itemPath: ['exports', '.', 'require'],
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: undefined,
        itemPath: ['exports'],
      }),
    ).toBeTruthy();

    expect(
      shouldRequire({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
        itemPath: ['exports', '.', 'import'],
      }),
    ).toBeFalsy();
  });
});

describe('shouldImport()', () => {
  it('Returns true for cjs packages', () => {
    expect(
      shouldImport({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
        itemPath: ['main'],
      }),
    ).toBeTruthy();
  });

  it('Returns a boolean', () => {
    expect(
      shouldImport({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: undefined,
        condition: undefined,
        itemPath: ['main'],
      }),
    ).toBeTruthy();

    expect(
      shouldImport({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'commonjs',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
        itemPath: ['exports', '.', 'import'],
      }),
    ).toBeTruthy();

    expect(
      shouldImport({
        packagePath: './package.json',
        packageDirectory: './',
        moduleName: 'example-package',
        type: 'module',
        fileName: 'test.js',
        relativePath: 'test.js',
        directory: process.cwd(),
        resolvedPath: process.cwd(),
        subpath: '.',
        condition: 'import',
        itemPath: ['exports', '.', 'import'],
      }),
    ).toBeTruthy();
  });
});
