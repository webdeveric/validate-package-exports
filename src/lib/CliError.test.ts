import { describe, expect, it } from 'vitest';

import { CliError } from '@lib/CliError.js';
import { ExitCodes } from '@src/types.js';

describe('CliError', () => {
  it('Is an Error', () => {
    expect(new CliError('test', ExitCodes.Ok)).toBeInstanceOf(Error);
  });

  it('Has an ExitCode', () => {
    const error = new CliError('test', ExitCodes.Ok);

    expect(error.code).toEqual(ExitCodes.Ok);
  });
});
