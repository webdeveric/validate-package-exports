import { describe, expect, it } from 'vitest';

import { asyncExec } from './asyncExec.js';

describe('asyncExec()', () => {
  it('Is a function', () => {
    expect(typeof asyncExec === 'function').toBeTruthy();
  });
});
