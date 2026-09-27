import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PackageContext, PackageJson } from '@src/types.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { getNearestPackageType } from './getNearestPackageType.js';

vi.mock('node:fs');

function createTestPackageContext(packageJson: PackageJson): PackageContext {
  return createPackageContext({
    resolvedPath: '/project/package.json',
    realPath: '/project/package.json',
    packageJson,
    rawPackageJson: JSON.stringify(packageJson),
  });
}

describe('getNearestPackageType()', () => {
  afterEach(() => {
    vol.reset();
  });

  const packageContext = createTestPackageContext({ name: 'test-package', version: '1.0.0', type: 'module' });

  it('Returns the package type when given the package directory', () => {
    expect(getNearestPackageType('/project', packageContext)).toBe('module');
  });

  it('Returns the type from the package root package.json', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/index.js': '',
    });

    expect(getNearestPackageType('/project/dist/index.js', packageContext)).toBe('module');
  });

  it('Returns the type from the closest ancestor package.json', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/cjs/package.json': JSON.stringify({ type: 'commonjs' }),
      '/project/dist/cjs/index.js': '',
    });

    expect(getNearestPackageType('/project/dist/cjs/index.js', packageContext)).toBe('commonjs');
  });

  it('Skips package.json files without a type field', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/package.json': '{}',
      '/project/dist/index.js': '',
    });

    expect(getNearestPackageType('/project/dist/index.js', packageContext)).toBe('module');
  });

  it('Skips package.json files with an invalid type field', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'commonjs' }),
      '/project/dist/package.json': JSON.stringify({ type: 'invalid' }),
      '/project/dist/index.js': '',
    });

    expect(
      getNearestPackageType(
        '/project/dist/index.js',
        createTestPackageContext({ name: 'test-package', version: '1.0.0' }),
      ),
    ).toBe('commonjs');
  });

  it('Skips package.json files that cannot be parsed', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/package.json': '{ invalid json',
      '/project/dist/index.js': '',
    });

    expect(getNearestPackageType('/project/dist/index.js', packageContext)).toBe('module');
  });

  it('Does not look above the package directory', () => {
    vol.fromJSON({
      '/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/index.js': '',
    });

    expect(
      getNearestPackageType(
        '/project/dist/index.js',
        createTestPackageContext({ name: 'test-package', version: '1.0.0' }),
      ),
    ).toBeUndefined();
  });
});
