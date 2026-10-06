import type {
  ExportsEntryPath,
  EntryPoint,
  ExportsEntry,
  SubpathExports,
  ConditionalExport,
  PackageExports,
  ItemPath,
  AnyExportsEntry,
  PackageContext,
} from '@src/types.js';
import { createEntryPoint } from '@utils/createEntryPoint.js';
import { matchSubpathKey } from '@utils/matchSubpathKey.js';
import { resolveExportsTarget } from '@utils/resolveExportsTarget.js';
import {
  isConditionalExport,
  isExportsEntryPath,
  isExportsEntryArray,
  isSubpathExports,
} from '@utils/type-predicate.js';

export type ProcessExportsContext = Readonly<{
  condition?: string[];
  subpath?: string;
  itemPath: ItemPath;
}>;

/**
 * A subpath that has been blocked from being exported by setting it to `null`.
 *
 * @example
 * `{"./internal/*": null}` produces `{ subpath: "./internal/*", condition: [] }`.
 */
export type InternalSubpath = Readonly<{
  subpath: string;
  condition: string[];
  itemPath: ItemPath;
}>;

/**
 * Walk a `package.json` `exports` field and collect an `EntryPoint` for every non-`null` target,
 * tracking its subpath, condition chain, and `itemPath` along the way.
 *
 * While processing, it records every subpath key it sees and any subpath with a `null` target,
 * so that expanded subpath patterns can later be checked against the subpath key and conditions
 * Node would actually use to resolve them (see `skipShadowedSubpaths()`).
 *
 * @example
 * ```json
 * {"exports": {".": {"import": "./dist/index.mjs", "require": "./dist/index.cjs"}, "./internal/*": null}}
 * ```
 *
 * ```ts
 * const processor = new ExportsProcessor();
 *
 * // Two entry points: `.` with `['import']` and `.` with `['require']`.
 * const entryPoints = processor.process(packageJson.exports, { itemPath: ['exports'] }, packageContext);
 *
 * processor.isInternalSubpath('./internal/utils'); // true
 * ```
 */
export class ExportsProcessor {
  /**
   * Every subpath key seen while processing `SubpathExports`, with its target.
   */
  readonly subpaths = new Map<string, AnyExportsEntry>();

  /**
   * Subpaths that have a `null` target.
   */
  readonly internalSubpaths: InternalSubpath[] = [];

  /**
   * Get the subpath key that Node would use to resolve `subpath`.
   *
   * @example
   * ```json
   * {"./*": "./dist/*.js", "./internal/index": "./dist/internal/index.js"}
   * ```
   *
   * ```ts
   * processor.getSubpathKey('./internal/index'); // './internal/index'
   * processor.getSubpathKey('./utils'); // './*'
   * ```
   */
  getSubpathKey(subpath: string): string | undefined {
    return matchSubpathKey(this.subpaths.keys(), subpath);
  }

  /**
   * Determine if `subpath` resolves to a `null` target with the given `condition` chain,
   * using the same key matching and condition matching that Node uses.
   *
   * `default` always matches, so with no `condition`, this checks if `subpath` is blocked for everything.
   *
   * @example
   * ```json
   * {
   *   "./*": "./dist/*.js",
   *   "./internal/*": null,
   *   "./internal/index": "./dist/internal/index.js",
   *   "./cjs-only/*": {
   *     "import": null,
   *     "require": "./dist/*.cjs"
   *   }
   * }
   * ```
   *
   * ```ts
   * processor.isInternalSubpath('./internal/utils'); // true
   * processor.isInternalSubpath('./internal/index'); // false
   * processor.isInternalSubpath('./utils'); // false
   * processor.isInternalSubpath('./cjs-only/utils', ['import']); // true
   * processor.isInternalSubpath('./cjs-only/utils', ['require']); // false
   * ```
   */
  isInternalSubpath(subpath: string, condition: string[] = []): boolean {
    const key = this.getSubpathKey(subpath);

    if (typeof key === 'undefined') {
      return false;
    }

    const target = this.subpaths.get(key);

    return typeof target !== 'undefined' && resolveExportsTarget(target, condition) === null;
  }

  processExportsEntryPath(
    exportsEntryPath: ExportsEntryPath,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    if (exportsEntryPath === null) {
      if (typeof exportsContext.subpath !== 'undefined') {
        this.internalSubpaths.push({
          subpath: exportsContext.subpath,
          condition: exportsContext.condition ?? [],
          itemPath: exportsContext.itemPath,
        });
      }

      return [];
    }

    return [
      createEntryPoint({
        modulePath: exportsEntryPath,
        subpath: '.',
        ...exportsContext,
        packageContext,
      }),
    ];
  }

  processExportsEntry(
    exportsEntry: ExportsEntry,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    return isConditionalExport(exportsEntry)
      ? this.processConditionalExports(exportsEntry, exportsContext, packageContext)
      : this.processExportsEntryPath(exportsEntry, exportsContext, packageContext);
  }

  processExportsEntryArray(
    exportsEntries: ExportsEntry[],
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    return exportsEntries
      .map((entry, index) => {
        return this.processExportsEntry(
          entry,
          {
            ...exportsContext,
            itemPath: [...exportsContext.itemPath, index],
          },
          packageContext,
        );
      })
      .flat();
  }

  processSubpathExports(
    subpathExports: SubpathExports,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    return Object.entries(subpathExports)
      .map(([subpath, exportsEntry]) => {
        this.subpaths.set(subpath, exportsEntry);

        return this.process(
          exportsEntry,
          {
            ...exportsContext,
            subpath,
            itemPath: [...exportsContext.itemPath, subpath],
          },
          packageContext,
        );
      })
      .flat();
  }

  processConditionalExports(
    conditionalExport: ConditionalExport,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    const condition = exportsContext.condition ?? [];

    // `default` nested directly under a real condition (e.g. `require`/`import`) doesn't add
    // information on its own, so it's only appended when it isn't already inside a condition chain.
    const getCondition = (conditionName: string, exportsEntry: AnyExportsEntry): string[] => {
      if (conditionName === 'default' && !isConditionalExport(exportsEntry) && condition.length > 0) {
        return condition;
      }

      return [...condition, conditionName];
    };

    return Object.entries(conditionalExport)
      .map(([conditionName, exportsEntry]) => {
        return this.process(
          exportsEntry,
          {
            ...exportsContext,
            condition: getCondition(conditionName, exportsEntry),
            itemPath: [...exportsContext.itemPath, conditionName],
          },
          packageContext,
        );
      })
      .flat();
  }

  process(
    exports: PackageExports | undefined,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    /*
      "exports": "./some-path.js"

      "exports": null
    */
    if (isExportsEntryPath(exports)) {
      return this.processExportsEntryPath(exports, exportsContext, packageContext);
    }

    /*
      "exports": ["./some-path.js"]

      "exports": [
        {"default": "./some-path.js"}
      ]
    */
    if (isExportsEntryArray(exports)) {
      return this.processExportsEntryArray(exports, exportsContext, packageContext);
    }

    /*
      "exports": {
        ".": "./some-path.js",
      }
    */
    if (isSubpathExports(exports)) {
      return this.processSubpathExports(exports, exportsContext, packageContext);
    }

    /*
      "exports": {
        "require": "./some-path.cjs",
        "import": "./some-path.mjs",
      }
    */
    if (isConditionalExport(exports)) {
      return this.processConditionalExports(exports, exportsContext, packageContext);
    }

    return [];
  }
}
