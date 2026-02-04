import { AssertionError } from 'node:assert';

import { describe, expect, it } from 'vitest';

import { getDetails } from '@utils/getDetails.js';

describe('getDetails()', () => {
  it('Returns an object with all properties from input', () => {
    expect(
      getDetails({
        test: true,
        get demo() {
          return 1;
        },
      }),
    ).toEqual({ test: true, demo: 1 });
  });

  it('Works with Error instances', () => {
    expect(getDetails(new Error('test'))).toEqual(
      expect.objectContaining({ message: 'test', stack: expect.any(String) }),
    );
  });

  it('Works with AggregateError instances', () => {
    expect(getDetails(new AggregateError([new Error('inner error')], 'outer error'))).toEqual(
      expect.objectContaining({
        message: 'outer error',
        stack: expect.any(String),
        errors: expect.arrayContaining([
          expect.objectContaining({
            message: 'inner error',
            stack: expect.any(String),
          }),
        ]),
      }),
    );
  });

  it('Works with AssertionError instances', () => {
    expect(getDetails(new AssertionError({ message: 'test', expected: 1, actual: 0 }))).toEqual(
      expect.objectContaining({ message: 'test', stack: expect.any(String), expected: 1, actual: 0 }),
    );
  });
});
