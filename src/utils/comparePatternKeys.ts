/**
 * Order subpath pattern keys by specificity, most specific first.
 *
 * @see {@link https://nodejs.org/api/esm.html#resolution-algorithm-specification `PATTERN_KEY_COMPARE()`}
 *
 * @example
 * ```ts
 * ['./*', './internal/*.js', './internal/*'].sort(comparePatternKeys); // ['./internal/*.js', './internal/*', './*']
 * ```
 */
export function comparePatternKeys(left: string, right: string): number {
  const baseLengthLeft = left.indexOf('*') + 1;
  const baseLengthRight = right.indexOf('*') + 1;

  return baseLengthLeft !== baseLengthRight ? baseLengthRight - baseLengthLeft : right.length - left.length;
}
