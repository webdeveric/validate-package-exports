import { describe, expect, it } from 'vitest';

import type { PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { createPackageContext } from './createPackageContext.js';
import { getConcreteSubpath } from './getConcreteSubpath.js';
import { normalizePackageJsonPath } from './resolvePackageJson.js';

describe('getConcreteSubpath()', () => {
  const mockPackageJson = {
    name: 'mock-package',
    type: 'module',
    version: '0.0.0',
  } satisfies PackageJson;

  const packageContext = createPackageContext({
    resolvedPath: normalizePackageJsonPath('/tmp/package.json'),
    realPath: normalizePackageJsonPath('/tmp/package.json'),
    packageJson: mockPackageJson,
    rawPackageJson: JSON.stringify(mockPackageJson),
  });

  it('Returns "." for the package name', () => {
    const entryPoint = createEntryPoint({
      moduleName: 'mock-package',
      modulePath: './dist/index.js',
      packageContext,
      subpath: '.',
      itemPath: ['exports', '.'],
    });

    expect(getConcreteSubpath(entryPoint)).toBe('.');
  });

  it('Returns the subpath relative to the package name', () => {
    const entryPoint = createEntryPoint({
      moduleName: 'mock-package/internal/utils',
      modulePath: './dist/internal/utils.js',
      packageContext,
      subpath: './internal/*',
      itemPath: ['exports', './internal/*'],
    });

    expect(getConcreteSubpath(entryPoint)).toBe('./internal/utils');
  });

  it('Returns undefined when there is no module name', () => {
    const entryPoint = createEntryPoint({
      modulePath: './bin/cli.js',
      packageContext,
      subpath: undefined,
      itemPath: ['bin'],
    });

    expect(getConcreteSubpath(entryPoint)).toBeUndefined();
  });
});
