import type { ExitCodes } from './types.js';

export class CliError extends Error {
  code: ExitCodes;

  constructor(message: string | undefined, code: ExitCodes) {
    super(message);

    this.code = code;
  }
}
