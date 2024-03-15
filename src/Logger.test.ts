import { Console } from 'node:console';
import { PassThrough } from 'node:stream';

import { beforeEach, describe, expect, it } from 'vitest';

import { Logger, LogLevel } from './Logger.js';

describe('Logger', () => {
  const options = {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  };

  it('Is a Console', () => {
    expect(new Logger(options)).toBeInstanceOf(Console);
  });

  describe('LogLevel', () => {
    it('Accepts a LogLevel', () => {
      expect(new Logger(options, LogLevel.Debug).logLevel).toEqual(LogLevel.Debug);
    });

    it('Can get/set the logLevel', () => {
      const logger = new Logger(options, LogLevel.Informational);

      expect(logger.logLevel).toEqual(LogLevel.Informational);

      logger.logLevel = LogLevel.Alert;

      expect(logger.logLevel).toEqual(LogLevel.Alert);
    });

    it('Throws when being set to an invalid value', () => {
      expect(() => {
        new Logger(options).logLevel = Number.NaN;
      }).toThrow();
    });
  });

  describe('Log level specific methods', () => {
    let logger: Logger;
    let outputs: unknown[];
    let stream: PassThrough;

    beforeEach(() => {
      outputs = [];

      stream = new PassThrough({
        transform(chunk, _encoding, callback) {
          outputs.push(chunk);

          callback(null);
        },
      });

      logger = new Logger({
        stdout: stream,
        stderr: stream,
      });
    });

    it('error() is only used when level >= LogLevel.Error', () => {
      logger.logLevel = LogLevel.Critical;

      logger.error('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Error;

      logger.error('test');

      expect(outputs).toHaveLength(1);
    });

    it('warn() is only used when level >= LogLevel.Warning', () => {
      logger.logLevel = LogLevel.Critical;

      logger.warn('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Warning;

      logger.warn('test');

      expect(outputs).toHaveLength(1);
    });

    it('info() is only used when level >= LogLevel.Informational', () => {
      logger.logLevel = LogLevel.Critical;

      logger.info('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Informational;

      logger.info('test');

      expect(outputs).toHaveLength(1);
    });

    it('debug() is only used when level >= LogLevel.Debug', () => {
      logger.logLevel = LogLevel.Informational;

      logger.debug('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Debug;

      logger.debug('test');

      expect(outputs).toHaveLength(1);
    });
  });
});
