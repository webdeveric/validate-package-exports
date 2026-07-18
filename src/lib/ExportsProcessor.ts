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
import {
  isConditionalExport,
  isExportsEntryPath,
  isExportsEntryArray,
  isSubpathExports,
} from '@utils/type-predicate.js';

export type ProcessExportsContext = {
  condition?: string[];
  subpath?: string;
  itemPath: ItemPath;
};

export class ExportsProcessor {
  processExportsEntryPath(
    exportsEntryPath: ExportsEntryPath,
    exportsContext: ProcessExportsContext,
    packageContext: PackageContext,
  ): EntryPoint[] {
    return exportsEntryPath === null
      ? []
      : [
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
