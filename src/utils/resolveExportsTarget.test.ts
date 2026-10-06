import { describe, expect, it } from 'vitest';

import type { AnyExportsEntry } from '@src/types.js';

import { resolveExportsTarget } from './resolveExportsTarget.js';

describe('resolveExportsTarget()', () => {
  it('Returns paths and null as-is', () => {
    expect(resolveExportsTarget('./index.js', [])).toBe('./index.js');
    expect(resolveExportsTarget(null, [])).toBeNull();
  });

  it('Resolves using the active conditions', () => {
    const target = { import: null, require: './index.cjs' } satisfies AnyExportsEntry;

    expect(resolveExportsTarget(target, ['require'])).toBe(target.require);
    expect(resolveExportsTarget(target, ['import'])).toBeNull();
    expect(resolveExportsTarget(target, ['types'])).toBeUndefined();
    expect(resolveExportsTarget(target, [])).toBeUndefined();
  });

  it('Always matches default', () => {
    expect(resolveExportsTarget({ default: null }, [])).toBeNull();
    expect(resolveExportsTarget({ import: './index.js', default: null }, ['require'])).toBeNull();
    expect(resolveExportsTarget({ import: './index.js', default: null }, ['import'])).toBe('./index.js');
  });

  it('Uses the first matching condition in object order', () => {
    const target = { types: './index.d.ts', import: './index.js' } satisfies AnyExportsEntry;

    expect(resolveExportsTarget(target, ['import', 'types'])).toBe(target.types);
    expect(resolveExportsTarget(target, ['import'])).toBe(target.import);
  });

  it('Resolves nested conditions', () => {
    const target = {
      node: { import: null, default: './node.cjs' },
      default: './browser.js',
    } satisfies AnyExportsEntry;

    expect(resolveExportsTarget(target, ['node', 'import'])).toBeNull();
    expect(resolveExportsTarget(target, ['node', 'require'])).toBe(target.node.default);
    expect(resolveExportsTarget(target, ['import'])).toBe(target.default);
  });

  it('Falls through a nested condition that does not match', () => {
    const target = {
      node: { import: './node.mjs' },
      default: null,
    } satisfies AnyExportsEntry;

    expect(resolveExportsTarget(target, ['node', 'import'])).toBe(target.node.import);
    expect(resolveExportsTarget(target, ['node', 'require'])).toBeNull();
  });

  it('Uses the first resolved item in an array', () => {
    expect(resolveExportsTarget([{ import: './index.js' }, null], ['require'])).toBeNull();
    expect(resolveExportsTarget([{ import: './index.js' }, null], ['import'])).toBe('./index.js');
    expect(resolveExportsTarget([null, './index.js'], [])).toBeNull();
  });
});
