import { describe, it, expect } from 'vitest';

import { CliError } from '@lib/CliError.js';
import { ExitCodes } from '@src/types.js';

describe('CliError', () => {
  it('Is an Error', () => {
    expect(new CliError('test', ExitCodes.OK)).toBeInstanceOf(Error);
  });

  it('Has an ExitCode', () => {
    const error = new CliError('test', ExitCodes.OK);

    expect(error.code).toEqual(ExitCodes.OK);
  });
});
