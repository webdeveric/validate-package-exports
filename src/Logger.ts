import assert from 'node:assert';
import { Console, type ConsoleConstructorOptions } from 'node:console';

/**
 * @see https://datatracker.ietf.org/doc/html/rfc5424#page-11
 */
export enum LogLevel {
  Emergency,
  Alert,
  Critical,
  Error,
  Warning,
  Notice,
  Informational,
  Debug,
}

export class Logger extends Console {
  #logLevel: LogLevel;

  constructor(options: Partial<ConsoleConstructorOptions> = {}, logLevel: LogLevel = LogLevel.Warning) {
    super({
      stdout: process.stdout,
      stderr: process.stderr,
      inspectOptions: {
        depth: null,
      },
      ...options,
    });

    this.#logLevel = logLevel;
  }

  get logLevel(): LogLevel {
    return this.#logLevel;
  }

  set logLevel(logLevel: LogLevel) {
    assert(Object.values(LogLevel).includes(logLevel), 'Invalid log level');

    this.#logLevel = logLevel;
  }

  override error(...args: Parameters<Console['info']>): void {
    if (this.#logLevel >= LogLevel.Error) {
      super.error(...args);
    }
  }

  override warn(...args: Parameters<Console['info']>): void {
    if (this.#logLevel >= LogLevel.Warning) {
      super.warn(...args);
    }
  }

  override info(...args: Parameters<Console['info']>): void {
    if (this.#logLevel >= LogLevel.Informational) {
      super.info(...args);
    }
  }

  override debug(...args: Parameters<Console['debug']>): void {
    if (this.#logLevel >= LogLevel.Debug) {
      super.info(...args);
    }
  }
}
