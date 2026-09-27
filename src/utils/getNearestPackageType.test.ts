import { resolve } from 'node:path';

import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PackageContext, PackageJson } from '@src/types.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { getNearestPackageType } from './getNearestPackageType.js';

vi.mock('node:fs');

function createTestPackageContext(packageJson: PackageJson): PackageContext {
  return createPackageContext({
    resolvedPath: resolve('/project/package.json'),
    realPath: resolve('/project/package.json'),
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
    expect(getNearestPackageType(resolve('/project'), packageContext)).toBe('module');
  });

  it('Returns the type from the package root package.json', () => {
    vol.fromJSON({
      [resolve('/project/package.json')]: JSON.stringify({ type: 'module' }),
      [resolve('/project/dist/index.js')]: '',
    });

    expect(getNearestPackageType(resolve('/project/dist/index.js'), packageContext)).toBe('module');
  });

  it('Returns the type from the closest ancestor package.json', () => {
    vol.fromJSON({
      [resolve('/project/package.json')]: JSON.stringify({ type: 'module' }),
      [resolve('/project/dist/cjs/package.json')]: JSON.stringify({ type: 'commonjs' }),
      [resolve('/project/dist/cjs/index.js')]: '',
    });

    expect(getNearestPackageType(resolve('/project/dist/cjs/index.js'), packageContext)).toBe('commonjs');
  });

  it('Skips package.json files without a type field', () => {
    vol.fromJSON({
      [resolve('/project/package.json')]: JSON.stringify({ type: 'module' }),
      [resolve('/project/dist/package.json')]: '{}',
      [resolve('/project/dist/index.js')]: '',
    });

    expect(getNearestPackageType(resolve('/project/dist/index.js'), packageContext)).toBe('module');
  });

  it('Skips package.json files with an invalid type field', () => {
    vol.fromJSON({
      [resolve('/project/package.json')]: JSON.stringify({ type: 'commonjs' }),
      [resolve('/project/dist/package.json')]: JSON.stringify({ type: 'invalid' }),
      [resolve('/project/dist/index.js')]: '',
    });

    expect(
      getNearestPackageType(
        resolve('/project/dist/index.js'),
        createTestPackageContext({ name: 'test-package', version: '1.0.0' }),
      ),
    ).toBe('commonjs');
  });

  it('Skips package.json files that cannot be parsed', () => {
    vol.fromJSON({
      [resolve('/project/package.json')]: JSON.stringify({ type: 'module' }),
      [resolve('/project/dist/package.json')]: '{ invalid json',
      [resolve('/project/dist/index.js')]: '',
    });

    expect(getNearestPackageType(resolve('/project/dist/index.js'), packageContext)).toBe('module');
  });

  it('Does not look above the package directory', () => {
    vol.fromJSON({
      [resolve('/package.json')]: JSON.stringify({ type: 'module' }),
      [resolve('/project/dist/index.js')]: '',
    });

    expect(
      getNearestPackageType(
        resolve('/project/dist/index.js'),
        createTestPackageContext({ name: 'test-package', version: '1.0.0' }),
      ),
    ).toBeUndefined();
  });
});
