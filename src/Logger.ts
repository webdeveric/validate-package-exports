import { Console, type ConsoleConstructorOptions } from 'node:console';

import { LogLevel, type LogLevelName } from './types.js';
import { parseLogLevel } from './utils/parseLogLevel.js';

export class Logger extends Console {
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
    if (this.#logLevel >= LogLevel.Info) {
      super.info(...args);
    }
  }

  override debug(...args: Parameters<Console['debug']>): void {
    if (this.#logLevel >= LogLevel.Debug) {
      super.info(...args);
    }
  }
}
