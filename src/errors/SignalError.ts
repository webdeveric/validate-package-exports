import { constants } from 'node:os';

import type { UnknownRecord } from '@webdeveric/utils/types/records';

export type SignalErrorOptions = ErrorOptions & {
  details?: UnknownRecord;
};

/**
 * Error representing process termination by a signal (e.g. `SIGINT`, `SIGTERM`)
 */
export class SignalError extends Error {
  override readonly name = 'SignalError';

  readonly signalName: NodeJS.Signals;

  readonly details: UnknownRecord | undefined;

  readonly exitCode: number;

  constructor(signalName: NodeJS.Signals, message?: string, options: SignalErrorOptions = {}) {
    const { details, ...errorOptions } = options;

    super(message, errorOptions);

    this.signalName = signalName;
    this.details = details;

    /**
     * This follows the standard POSIX practice of 128 + the signal code.
     *
     * @see https://nodejs.org/api/process.html#exit-codes
     *
     * @privateRemarks
     * TODO: use `convertProcessSignalToExitCode()` after dropping Node 22 support.
     * @see https://nodejs.org/docs/latest-v24.x/api/util.html#utilconvertprocesssignaltoexitcodesignal
     */
    this.exitCode = constants.signals[signalName] + 128;
  }

  toJSON(): UnknownRecord {
    return {
      name: this.name,
      signalName: this.signalName,
      message: this.message,
      cause: this.cause,
      exitCode: this.exitCode,
      details: this.details,
      stack: this.stack,
    };
  }

  get [Symbol.toStringTag](): string {
    return this.name;
  }
}
