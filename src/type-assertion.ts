import { AssertionError } from 'node:assert';

import { isPackageJson } from '@src/type-predicate.js';
import type { PackageJson } from '@src/types.js';

export function assertIsPackageJson(input: unknown): asserts input is PackageJson {
  if (!isPackageJson(input)) {
    throw new AssertionError({
      message: 'input is not PackageJson',
      actual: input,
    });
  }
}
