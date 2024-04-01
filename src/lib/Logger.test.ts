import { Console } from 'node:console';
import { PassThrough } from 'node:stream';

import { beforeEach, describe, expect, it } from 'vitest';

import { LogLevel } from '@src/types.js';

import { Logger } from './Logger.js';

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
      const logger = new Logger(options, LogLevel.Info);

      expect(logger.logLevel).toEqual(LogLevel.Info);

      logger.logLevel = LogLevel.Alert;

      expect(logger.logLevel).toEqual(LogLevel.Alert);
    });

    it('Ues default value when being set to an invalid value', () => {
      const logger = new Logger(options, Number.NaN);

      expect(logger.logLevel).toEqual(LogLevel.Warning);

      logger.logLevel = 12345 as LogLevel;

      expect(logger.logLevel).toEqual(LogLevel.Warning);
    });
  });

  it('willLog()', () => {
    expect(new Logger(options, LogLevel.Emergency).willLog(LogLevel.Emergency)).toBeTruthy();

    expect(new Logger(options, LogLevel.Info).willLog(LogLevel.Debug)).toBeFalsy();
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

    it.each([
      LogLevel.Emergency,
      LogLevel.Alert,
      LogLevel.Critical,
      LogLevel.Error,
      LogLevel.Warning,
      LogLevel.Notice,
      LogLevel.Info,
      LogLevel.Debug,
    ])('emergency() logs for LogLevel: %d', logLevel => {
      logger.logLevel = logLevel;

      logger.emergency('test');

      expect(outputs).toHaveLength(1);
    });

    it('alert() is only used when level >= LogLevel.Alert', () => {
      logger.logLevel = LogLevel.Emergency;

      logger.alert('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Alert;

      logger.alert('test');

      expect(outputs).toHaveLength(1);
    });

    it('critical() is only used when level >= LogLevel.Critical', () => {
      logger.logLevel = LogLevel.Alert;

      logger.critical('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Critical;

      logger.critical('test');

      expect(outputs).toHaveLength(1);
    });

    it('error() is only used when level >= LogLevel.Error', () => {
      logger.logLevel = LogLevel.Critical;

      logger.error('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Error;

      logger.error('test');

      expect(outputs).toHaveLength(1);
    });

    it.each(['warn', 'warning'] satisfies (keyof Logger)[])(
      'warn() is only used when level >= LogLevel.Warning',
      method => {
        logger.logLevel = LogLevel.Critical;

        logger[method]('test');

        expect(outputs).toHaveLength(0);

        logger.logLevel = LogLevel.Warning;

        logger[method]('test');

        expect(outputs).toHaveLength(1);
      },
    );

    it('notice() is only used when level >= LogLevel.Notice', () => {
      logger.logLevel = LogLevel.Critical;

      logger.notice('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Notice;

      logger.notice('test');

      expect(outputs).toHaveLength(1);
    });

    it('info() is only used when level >= LogLevel.Informational', () => {
      logger.logLevel = LogLevel.Critical;

      logger.info('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Info;

      logger.info('test');

      expect(outputs).toHaveLength(1);
    });

    it('debug() is only used when level >= LogLevel.Debug', () => {
      logger.logLevel = LogLevel.Info;

      logger.debug('test');

      expect(outputs).toHaveLength(0);

      logger.logLevel = LogLevel.Debug;

      logger.debug('test');

      expect(outputs).toHaveLength(1);
    });
  });
});
