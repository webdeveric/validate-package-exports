import { comparePatternKeys } from './comparePatternKeys.js';

/**
 * Find the `exports` key that Node would use to resolve `subpath`.
 *
 * An exact key match always wins. Otherwise, the most specific matching pattern key wins.
 *
 * @see {@link https://nodejs.org/api/esm.html#resolution-algorithm-specification `PACKAGE_IMPORTS_EXPORTS_RESOLVE()`}
 *
 * @example
 * ```ts
 * matchSubpathKey(['./*', './internal/*', './internal/index'], './internal/index'); // './internal/index'
 * matchSubpathKey(['./*', './internal/*', './internal/index'], './internal/utils'); // './internal/*'
 * matchSubpathKey(['./*', './internal/*', './internal/index'], './utils'); // './*'
 * ```
 */
export function matchSubpathKey(keys: Iterable<string>, subpath: string): string | undefined {
  const patternKeys: string[] = [];

  for (const key of keys) {
    if (key === subpath && !key.includes('*')) {
      return key;
    }

    const starIndex = key.indexOf('*');

    if (starIndex > -1 && starIndex === key.lastIndexOf('*')) {
      const prefix = key.slice(0, starIndex);
      const suffix = key.slice(starIndex + 1);

      if (
        subpath !== prefix &&
        subpath.startsWith(prefix) &&
        subpath.length >= key.length &&
        (suffix.length === 0 || subpath.endsWith(suffix))
      ) {
        patternKeys.push(key);
      }
    }
  }

  return patternKeys.sort(comparePatternKeys).at(0);
}
