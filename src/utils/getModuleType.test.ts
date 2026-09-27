import { vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PackageContext, PackageJson } from '@src/types.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { getModuleType } from './getModuleType.js';

vi.mock('node:fs');

function createTestPackageContext(packageJson: PackageJson): PackageContext {
  return createPackageContext({
    resolvedPath: '/project/package.json',
    realPath: '/project/package.json',
    packageJson,
    rawPackageJson: JSON.stringify(packageJson),
  });
}

describe('getModuleType()', () => {
  afterEach(() => {
    vol.reset();
  });

  const commonjsContext = createTestPackageContext({ name: 'test-package', version: '1.0.0' });
  const moduleContext = createTestPackageContext({ name: 'test-package', version: '1.0.0', type: 'module' });

  it('A .cjs or .mjs extension takes priority over the package type', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
    });

    expect(getModuleType('/project/dist/file.cjs', moduleContext)).toBe('commonjs');

    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'commonjs' }),
    });

    expect(getModuleType('/project/dist/file.mjs', commonjsContext)).toBe('module');
  });

  it('Uses the package type when no package.json is found', () => {
    expect(getModuleType('/project/dist/index.js', commonjsContext)).toBe('commonjs');
    expect(getModuleType('/project/dist/index.js', moduleContext)).toBe('module');
  });

  it('Uses the package type when given the package directory', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'commonjs' }),
    });

    expect(getModuleType('/project', moduleContext)).toBe('module');
  });

  it("Uses the nearest package.json's type, overriding the package type", () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/cjs/package.json': JSON.stringify({ type: 'commonjs' }),
      '/project/dist/cjs/index.js': '',
    });

    expect(getModuleType('/project/dist/cjs/index.js', moduleContext)).toBe('commonjs');
  });

  it('Skips a nearest package.json that has no "type"', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/package.json': '{}',
      '/project/dist/index.js': '',
    });

    expect(getModuleType('/project/dist/index.js', moduleContext)).toBe('module');
  });

  it('Does not look above the package directory', () => {
    vol.fromJSON({
      '/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/index.js': '',
    });

    expect(getModuleType('/project/dist/index.js', commonjsContext)).toBe('commonjs');
  });

  it('Works even when the file does not exist yet', () => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ type: 'module' }),
      '/project/dist/package.json': JSON.stringify({ type: 'commonjs' }),
    });

    expect(getModuleType('/project/dist/not-built-yet.js', moduleContext)).toBe('commonjs');
  });
});
