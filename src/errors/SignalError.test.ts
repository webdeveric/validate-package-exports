import { describe, expect, it } from 'vitest';

import { SignalError } from './SignalError.js';

describe('SignalError', () => {
  it('Sets signalName and computes exitCode as 128 + signal number', () => {
    const error = new SignalError('SIGINT');

    expect(error.signalName).toBe('SIGINT');
    expect(error.exitCode).toBe(130);
    expect(error.name).toBe('SignalError');
    expect(error).toBeInstanceOf(Error);
  });

  it('Computes exitCode for other signals', () => {
    expect(new SignalError('SIGTERM').exitCode).toBe(143);
    expect(new SignalError('SIGHUP').exitCode).toBe(129);
  });

  it('Accepts an optional message', () => {
    const error = new SignalError('SIGINT', 'Process was interrupted');

    expect(error.message).toBe('Process was interrupted');
  });

  it('Accepts details and cause via options', () => {
    const cause = new Error('root cause');
    const details = { pid: 1234 };

    const error = new SignalError('SIGTERM', 'Terminated', { cause, details });

    expect(error.cause).toBe(cause);
    expect(error.details).toEqual(details);
  });

  it('Has undefined details when not provided', () => {
    const error = new SignalError('SIGINT');

    expect(error.details).toBeUndefined();
  });

  it('Serializes to JSON', () => {
    const cause = new Error('root cause');
    const details = { pid: 1234 };

    const error = new SignalError('SIGTERM', 'Terminated', { cause, details });

    expect(error.toJSON()).toEqual({
      name: 'SignalError',
      signalName: 'SIGTERM',
      message: 'Terminated',
      cause,
      exitCode: 143,
      details,
      stack: error.stack,
    });
  });

  it('Uses name for Symbol.toStringTag', () => {
    const error = new SignalError('SIGINT');

    expect(error[Symbol.toStringTag]).toBe('SignalError');
    expect(Object.prototype.toString.call(error)).toBe('[object SignalError]');
  });
});
