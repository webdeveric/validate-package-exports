import { availableParallelism } from 'node:os';

import { describe, expect, it } from 'vitest';

import { parseConcurrency } from './parseConcurrency.js';

describe('parseConcurrency()', () => {
  it('Returns an integer', () => {
    expect(parseConcurrency('1')).toEqual(1);
    expect(parseConcurrency(1)).toEqual(1);
  });

  it('Negative values return 1', () => {
    expect(parseConcurrency('-100')).toEqual(1);
    expect(parseConcurrency(-100)).toEqual(1);
  });

  it.each(['bad input', undefined, true, false, null, {}, []])(
    'Defaults to availableParallelism() when given "%s"',
    (value) => {
      const defaultValue = availableParallelism();

      expect(parseConcurrency(value)).toEqual(defaultValue);
    },
  );
});
