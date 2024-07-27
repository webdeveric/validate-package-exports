import { describe, expect, it } from 'vitest';

import { LogLevel } from '@src/types.js';

import { parseLogLevel } from './parseLogLevel.js';

describe('parseLogLevel()', () => {
  it('Returns a LogLevel', () => {
    expect(parseLogLevel('info')).toEqual(LogLevel.Info);
    expect(parseLogLevel(LogLevel.Info, LogLevel.Warning)).toEqual(LogLevel.Info);
  });

  it.each(['bad input', Number.MAX_SAFE_INTEGER, undefined, true, false, null, [], {}])(
    'Returns default value when given "%s"',
    (value) => {
      expect(parseLogLevel(value, LogLevel.Alert)).toEqual(LogLevel.Alert);
    },
  );
});
