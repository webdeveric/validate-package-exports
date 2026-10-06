import type { AnyExportsEntry, ExportsEntryPath } from '@src/types.js';

import { isConditionalExport, isExportsEntryArray, isExportsEntryPath } from './type-predicate.js';

/**
 * Resolve an `exports` target using the active `conditions`, like Node does.
 *
 * `default` always matches. Conditions are checked in object order, so the first matching condition wins.
 *
 * Returns `null` when the target is blocked and `undefined` when no condition matches.
 *
 * @see {@link https://nodejs.org/api/esm.html#resolution-algorithm-specification `PACKAGE_TARGET_RESOLVE()`}
 *
 * @example
 * ```ts
 * resolveExportsTarget({ import: null, require: './index.js' }, ['require']); // './index.js'
 * resolveExportsTarget({ import: null, require: './index.js' }, ['import']); // null
 * resolveExportsTarget({ import: null, require: './index.js' }, ['types']); // undefined
 * ```
 */
export function resolveExportsTarget(
  target: AnyExportsEntry,
  conditions: Iterable<string>,
): ExportsEntryPath | undefined {
  const activeConditions = new Set(conditions);

  const resolveExportsEntry = (entry: AnyExportsEntry): ExportsEntryPath | undefined => {
    if (isExportsEntryPath(entry)) {
      return entry;
    }

    if (isExportsEntryArray(entry)) {
      for (const item of entry) {
        const resolved = resolveExportsEntry(item);

        if (typeof resolved !== 'undefined') {
          return resolved;
        }
      }

      return;
    }

    if (isConditionalExport(entry)) {
      for (const [condition, conditionValue] of Object.entries(entry)) {
        if (condition !== 'default' && !activeConditions.has(condition)) {
          continue;
        }

        const resolved = resolveExportsEntry(conditionValue);

        if (typeof resolved !== 'undefined') {
          return resolved;
        }
      }
    }
  };

  return resolveExportsEntry(target);
}
