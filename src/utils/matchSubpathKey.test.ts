import { describe, expect, it } from 'vitest';

import { matchSubpathKey } from './matchSubpathKey.js';

describe('matchSubpathKey()', () => {
  const keys = [
    '.',
    './*',
    './internal/*',
    './internal/*/*.js',
    './internal/index',
    './features/*.js',
    './package.json',
  ];

  it('Prefers an exact match', () => {
    expect(matchSubpathKey(keys, '.')).toBe('.');
    expect(matchSubpathKey(keys, './internal/index')).toBe('./internal/index');
    expect(matchSubpathKey(keys, './package.json')).toBe('./package.json');
  });

  it('Prefers the most specific pattern', () => {
    expect(matchSubpathKey(keys, './internal/utils')).toBe('./internal/*');
    expect(matchSubpathKey(keys, './internal/nested/utils')).toBe('./internal/*');
    expect(matchSubpathKey(keys, './features/thing.js')).toBe('./features/*.js');
    expect(matchSubpathKey(keys, './features/thing')).toBe('./*');
    expect(matchSubpathKey(keys, './utils')).toBe('./*');
  });

  it('Does not match the pattern base itself', () => {
    expect(matchSubpathKey(['./internal/*'], './internal/')).toBeUndefined();
  });

  it('Returns undefined when nothing matches', () => {
    expect(matchSubpathKey(['.', './internal/*'], './utils')).toBeUndefined();
    expect(matchSubpathKey([], '.')).toBeUndefined();
  });
});
