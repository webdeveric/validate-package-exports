import { describe, expect, it } from 'vitest';

import { getModuleType } from './getModuleType.js';

describe('getModuleType()', () => {
  it('Returns a string', () => {
    expect(getModuleType('file.js')).toEqual('commonjs');
    expect(getModuleType('file.js', 'commonjs')).toEqual('commonjs');
    expect(getModuleType('file.js', 'module')).toEqual('module');
    expect(getModuleType('file.js', 'module', 'require')).toEqual('commonjs');
    expect(getModuleType('file.js', 'commonjs', 'import')).toEqual('module');
    expect(getModuleType('file.cjs')).toEqual('commonjs');
    expect(getModuleType('file.mjs')).toEqual('module');
  });
});
