import { describe, it, expect } from 'vitest';

import { assertIsPackageJson } from '@src/type-assertion.js';

describe('assertIsPackageJson()', () => {
  it('Throws when given invalid input', () => {
    expect(() => {
      assertIsPackageJson({});
    }).toThrow();

    expect(() => {
      assertIsPackageJson({
        name: 'package',
        version: '1.1.1',
      });
    }).not.toThrow();
  });
});
