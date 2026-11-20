/**
 * Yield every item from `source`. If `source` yields nothing, yield every item from `fallback` instead.
 *
 * @example
 * ```ts
 * const packages = fallbackIfEmpty(readStdinLines(), ['./package.json']);
 * ```
 */
export async function* fallbackIfEmpty<T>(
  source: Iterable<T> | AsyncIterable<T>,
  fallback: Iterable<T> | AsyncIterable<T>,
): AsyncGenerator<T> {
  let isEmpty = true;

  for await (const item of source) {
    isEmpty = false;

    yield item;
  }

  if (isEmpty) {
    yield* fallback;
  }
}
