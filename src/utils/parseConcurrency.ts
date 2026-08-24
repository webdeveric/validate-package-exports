import { availableParallelism } from 'node:os';

import { clamp } from '@webdeveric/utils/clamp';
import { isIntString } from '@webdeveric/utils/predicate/isIntString';

/**
 * Parses a concurrency value, clamping it between 1 and the number of
 * available logical CPU cores. Falls back to `availableParallelism()`
 * when the input is not a valid integer.
 *
 * @example
 * ```ts
 * parseConcurrency('4'); // 4 (assuming <= available cores)
 * parseConcurrency('0'); // 1
 * parseConcurrency('bad'); // availableParallelism()
 * ```
 */
export function parseConcurrency(input: unknown): number {
  const value = String(input);

  return isIntString(value) ? clamp(1, Number.parseInt(value, 10), availableParallelism()) : availableParallelism();
}
