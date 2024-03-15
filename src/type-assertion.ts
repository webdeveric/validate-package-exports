import { AssertionError } from 'node:assert';

import { isLogLevelName, isPackageJson } from '@src/type-predicate.js';
import type { LogLevelName, PackageJson } from '@src/types.js';

export function assertIsPackageJson(input: unknown): asserts input is PackageJson {
  if (!isPackageJson(input)) {
    throw new AssertionError({
      message: 'input is not PackageJson',
      actual: input,
    });
  }
}

export function assertIsLogLevelName(input: unknown): asserts input is LogLevelName {
  if (!isLogLevelName(input)) {
    throw new AssertionError({
      message: 'input is not LogLevelName',
      actual: input,
    });
  }
}
