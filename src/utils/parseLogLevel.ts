import { LogLevel, logLevelMapping } from '@src/types.js';
import { isLogLevel, isLogLevelName } from '@utils/type-predicate.js';

export function parseLogLevel(input: unknown, defaultValue = LogLevel.Warning): LogLevel {
  if (typeof input === 'undefined') {
    return defaultValue;
  }

  if (isLogLevel(input)) {
    return input;
  }

  if (isLogLevelName(input)) {
    return logLevelMapping[input];
  }

  return defaultValue;
}
