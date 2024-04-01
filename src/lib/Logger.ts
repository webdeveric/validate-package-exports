import { Console, type ConsoleConstructorOptions } from 'node:console';

import { parseLogLevel } from '@utils/parseLogLevel.js';

import { LogLevel, type LogLevelName } from '../types.js';

export type LogLevelMethods = {
  [Property in LogLevelName]: (...args: Parameters<Console['log']>) => ReturnType<Console['log']>;
};

export class Logger extends Console implements LogLevelMethods {
  #logLevel: LogLevel;

  constructor(options: Partial<ConsoleConstructorOptions> = {}, logLevel?: LogLevel | LogLevelName | string) {
    super({
      stdout: process.stdout,
      stderr: process.stderr,
      inspectOptions: {
        depth: null,
      },
      ...options,
    });

    this.#logLevel = parseLogLevel(logLevel);
  }

  get logLevel(): LogLevel {
    return this.#logLevel;
  }

  set logLevel(logLevel: LogLevel | LogLevelName) {
    this.#logLevel = parseLogLevel(logLevel);
  }

  willLog(logLevel: LogLevel): boolean {
    return this.#logLevel >= logLevel;
  }

  emergency(...args: Parameters<Console['log']>): void {
    if (this.#logLevel >= LogLevel.Emergency) {
      super.log(...args);
    }
  }

  alert(...args: Parameters<Console['log']>): void {
    if (this.#logLevel >= LogLevel.Alert) {
      super.log(...args);
    }
  }

  critical(...args: Parameters<Console['log']>): void {
    if (this.#logLevel >= LogLevel.Critical) {
      super.log(...args);
    }
  }

  override error(...args: Parameters<Console['error']>): void {
    if (this.#logLevel >= LogLevel.Error) {
      super.error(...args);
    }
  }

  warning(...args: Parameters<Console['warn']>): void {
    this.warn(...args);
  }

  override warn(...args: Parameters<Console['warn']>): void {
    if (this.#logLevel >= LogLevel.Warning) {
      super.warn(...args);
    }
  }

  notice(...args: Parameters<Console['info']>): void {
    if (this.#logLevel >= LogLevel.Notice) {
      super.info(...args);
    }
  }

  override info(...args: Parameters<Console['info']>): void {
    if (this.#logLevel >= LogLevel.Info) {
      super.info(...args);
    }
  }

  override debug(...args: Parameters<Console['debug']>): void {
    if (this.#logLevel >= LogLevel.Debug) {
      super.debug(...args);
    }
  }
}
