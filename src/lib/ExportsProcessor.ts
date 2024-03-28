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
  condition?: string | undefined;
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
    const getCondition = (
      conditionName: string,
      exportsEntry: AnyExportsEntry,
      itemPath: ItemPath,
    ): string | undefined => {
      if (isConditionalExport(exportsEntry)) {
        return conditionName;
      }

      if (itemPath.at(-1) === 'default') {
        const segment = itemPath.at(-2);

        if (typeof segment === 'string') {
          return segment;
        }
      }

      return conditionName;
    };

    return Object.entries(conditionalExport)
      .map(([conditionName, exportsEntry]) => {
        const itemPath = [...exportsContext.itemPath, conditionName];

        return this.process(
          exportsEntry,
          {
            ...exportsContext,
            condition: getCondition(conditionName, exportsEntry, itemPath),
            itemPath,
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
