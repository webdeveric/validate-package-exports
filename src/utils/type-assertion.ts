import { AssertionError } from 'node:assert';

import type { PackageJson } from '@src/types.js';
import { isPackageJson } from '@utils/type-predicate.js';

export function assertIsPackageJson(input: unknown): asserts input is PackageJson {
  if (!isPackageJson(input)) {
    throw new AssertionError({
      message: 'input is not PackageJson',
      actual: input,
    });
  }
}
