import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ResultCode } from '@lib/Result.js';
import type { EntryPoint, PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { verifyStrictModuleType } from './verifyStrictModuleType.js';

const mockPackageJson = {
  name: 'mock-package',
  version: '0.0.0',
  exports: {
    '.': './index.js',
  },
} satisfies PackageJson;

const packageContext = createPackageContext({
  resolvedPath: resolve('/tmp/package.json'),
  realPath: resolve('/tmp/package.json'),
  packageJson: mockPackageJson,
  rawPackageJson: JSON.stringify(mockPackageJson),
});

const createEntryPoint = (condition: string[], type: EntryPoint['type']): EntryPoint => ({
  moduleName: 'mock-package',
  type,
  fileName: 'index.js',
  relativePath: './index.js',
  directory: resolve('/tmp'),
  resolvedPath: resolve('/tmp/index.js'),
  subpath: '.',
  condition,
  itemPath: ['exports', '.', ...condition],
  packageContext,
});

describe('verifyStrictModuleType()', () => {
  it.each([
    [['require'], 'module', ResultCode.Error],
    [['require'], 'commonjs', ResultCode.Success],
    [['import'], 'commonjs', ResultCode.Error],
    [['import'], 'module', ResultCode.Success],
    [['module-sync'], 'commonjs', ResultCode.Error],
    [['module-sync'], 'module', ResultCode.Success],
    [['node', 'module-sync'], 'commonjs', ResultCode.Error],
    [[], 'commonjs', ResultCode.Skip],
  ] satisfies [string[], EntryPoint['type'], ResultCode][])('%j with type="%s" returns %s', (condition, type, code) => {
    expect(verifyStrictModuleType(createEntryPoint(condition, type)).code).toBe(code);
  });
});
