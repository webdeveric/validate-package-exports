import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { getModuleType } from './getModuleType.js';

describe('getModuleType()', () => {
  it('A "require" or "import" condition takes priority over everything else', () => {
    expect(getModuleType('file.js', 'module', ['require'])).toEqual('commonjs');
    expect(getModuleType('file.js', 'commonjs', ['import'])).toEqual('module');
    expect(getModuleType('file.js', 'commonjs', ['node', 'import'])).toEqual('module');
  });

  it('A .cjs or .mjs extension takes priority over the given packageType', () => {
    expect(getModuleType('file.cjs', 'module')).toEqual('commonjs');
    expect(getModuleType('file.mjs', 'commonjs')).toEqual('module');
  });

  describe('Falling back to the nearest package.json "type"', () => {
    const dir = mkdtempSync(join(tmpdir(), 'validate-package-exports-getModuleType-'));

    writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'package.json'), JSON.stringify({ type: 'commonjs' }));

    afterAll(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('Uses the given packageType when no package.json is found on disk', () => {
      const outsideDir = mkdtempSync(join(tmpdir(), 'validate-package-exports-getModuleType-none-'));

      expect(getModuleType(join(outsideDir, 'file.js'))).toEqual('commonjs');
      expect(getModuleType(join(outsideDir, 'file.js'), 'module')).toEqual('module');

      rmSync(outsideDir, { recursive: true, force: true });
    });

    it("Uses the nearest package.json's type, overriding the given packageType", () => {
      expect(getModuleType(join(dir, 'index.js'), 'commonjs')).toEqual('module');
      expect(getModuleType(join(dir, 'dist', 'file.js'), 'module')).toEqual('commonjs');
    });

    it('Works even when the file does not exist on disk yet', () => {
      expect(getModuleType(join(dir, 'dist', 'not-built-yet.js'), 'module')).toEqual('commonjs');
    });
  });
});
