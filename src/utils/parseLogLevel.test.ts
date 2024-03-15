import { describe, expect, it } from 'vitest';

import { LogLevel } from '@src/types.js';

import { parseLogLevel } from './parseLogLevel.js';

describe('parseLogLevel()', () => {
  it('Returns a LogLevel', () => {
    expect(parseLogLevel('warning')).toEqual(LogLevel.Warning);
    expect(parseLogLevel(LogLevel.Warning)).toEqual(LogLevel.Warning);
  });

  it.each(['bad input', Number.MAX_SAFE_INTEGER, undefined, true, false, null, [], {}])(
    'Returns default value when given "%s"',
    value => {
      expect(parseLogLevel(value)).toEqual(LogLevel.Warning);
    },
  );
});
