import { isLogLevel, isLogLevelName } from '@src/type-predicate.js';
import { LogLevel, logLevelMapping } from '@src/types.js';

export function parseLogLevel(input: unknown): LogLevel {
  if (typeof input === 'undefined') {
    return LogLevel.Warning;
  }

  if (isLogLevel(input)) {
    return input;
  }

  if (isLogLevelName(input)) {
    return logLevelMapping[input];
  }

  return LogLevel.Warning;
}
