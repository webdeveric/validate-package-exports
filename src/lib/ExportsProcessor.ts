import type {
  PackageType,
  ExportsEntryPath,
  EntryPoint,
  ExportsEntry,
  SubpathExports,
  ConditionalExport,
  PackageExports,
  ItemPath,
  AnyExportsEntry,
} from '@src/types.js';
import { createEntryPoint } from '@utils/createEntryPoint.js';
import {
  isConditionalExport,
  isExportsEntryPath,
  isExportsEntryArray,
  isExportsEntry,
  isSubpathExports,
} from '@utils/type-predicate.js';

export type ProcessExportsContext = {
  packageType: PackageType;
  packageName: string;
  packageDirectory: string;
  condition?: string | undefined;
  subpath?: string;
  itemPath: ItemPath;
};

export class ExportsProcessor {
  processExportsEntryPath(exportsEntryPath: ExportsEntryPath, context: ProcessExportsContext): EntryPoint[] {
    return exportsEntryPath === null
      ? []
      : [
          createEntryPoint({
            modulePath: exportsEntryPath,
            subpath: '.',
            ...context,
          }),
        ];
  }

  processExportsEntry(exportsEntry: ExportsEntry, context: ProcessExportsContext): EntryPoint[] {
    return isConditionalExport(exportsEntry)
      ? this.processConditionalExports(exportsEntry, context)
      : this.processExportsEntryPath(exportsEntry, context);
  }

  processExportsEntryArray(exportsEntries: ExportsEntry[], context: ProcessExportsContext): EntryPoint[] {
    return exportsEntries
      .map((entry, index) => {
        return this.processExportsEntry(entry, {
          ...context,
          itemPath: [...context.itemPath, index],
        });
      })
      .flat();
  }

  processSubpathExports(subpathExports: SubpathExports, context: ProcessExportsContext): EntryPoint[] {
    return Object.entries(subpathExports)
      .map(([subpath, exportsEntry]) => {
        return this.process(exportsEntry, {
          ...context,
          subpath,
          itemPath: [...context.itemPath, subpath],
        });
      })
      .flat();
  }

  processConditionalExports(conditionalExport: ConditionalExport, context: ProcessExportsContext): EntryPoint[] {
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
        const itemPath = [...context.itemPath, conditionName];

        return this.process(exportsEntry, {
          ...context,
          condition: getCondition(conditionName, exportsEntry, itemPath),
          itemPath,
        });
      })
      .flat();
  }

  process(exports: PackageExports | undefined, context: ProcessExportsContext): EntryPoint[] {
    /*
      "exports": "./some-path.js"

      "exports": null
    */
    if (isExportsEntryPath(exports)) {
      return this.processExportsEntryPath(exports, context);
    }

    /*
      "exports": ["./some-path.js"]

      "exports": [
        {"default": "./some-path.js"}
      ]
    */
    if (isExportsEntryArray(exports)) {
      return this.processExportsEntryArray(exports, context);
    }

    if (isExportsEntry(exports)) {
      return this.processExportsEntry(exports, context);
    }

    /*
      "exports": {
        ".": "./some-path.js",
      }
    */
    if (isSubpathExports(exports)) {
      return this.processSubpathExports(exports, context);
    }

    /*
      "exports": {
        "require": "./some-path.cjs",
        "import": "./some-path.mjs",
      }
    */
    if (isConditionalExport(exports)) {
      return this.processConditionalExports(exports, context);
    }

    return [];
  }
}
