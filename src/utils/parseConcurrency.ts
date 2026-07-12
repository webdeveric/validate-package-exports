import { availableParallelism } from 'node:os';

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
  const defaultValue = availableParallelism();
  const value = Number.parseInt(`${input}`, 10);

  return Number.isInteger(value) ? Math.max(1, Math.min(value, defaultValue)) : defaultValue;
}
