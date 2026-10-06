import { describe, expect, it } from 'vitest';

import { comparePatternKeys } from './comparePatternKeys.js';

describe('comparePatternKeys()', () => {
  it('Orders a longer base before a shorter base', () => {
    expect(comparePatternKeys('./internal/*', './*')).toBeLessThan(0);
    expect(comparePatternKeys('./*', './internal/*')).toBeGreaterThan(0);
  });

  it('Prefers a longer base over a longer key', () => {
    expect(comparePatternKeys('./internal/*', './*/deeply/nested/file.js')).toBeLessThan(0);
  });

  it('Orders a longer key before a shorter key when the bases are equal', () => {
    expect(comparePatternKeys('./features/*.js', './features/*')).toBeLessThan(0);
    expect(comparePatternKeys('./features/*', './features/*.js')).toBeGreaterThan(0);
  });

  it('Returns 0 for keys of equal specificity', () => {
    expect(comparePatternKeys('./internal/*', './internal/*')).toBe(0);
    expect(comparePatternKeys('./a/*.js', './b/*.js')).toBe(0);
  });

  it('Sorts keys most specific first', () => {
    expect(['./*', './features/*', './internal/*/*.js', './features/*.js'].sort(comparePatternKeys)).toEqual([
      './internal/*/*.js',
      './features/*.js',
      './features/*',
      './*',
    ]);
  });
});
