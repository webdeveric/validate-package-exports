import { relative, dirname, basename, resolve } from 'node:path';

import type { PackageType, EntryPoint, ItemPath } from '@src/types.js';

import { getModuleName } from './getModuleName.js';
import { getModuleType } from './getModuleType.js';

export type CreateEntryPointOptions = {
  modulePath: string;
  packageDirectory: string;
  packageName: string;
  packageType?: PackageType | undefined;
  subpath: string | undefined;
  itemPath: ItemPath;
  condition?: string | undefined;
};

export function createEntryPoint({
  condition,
  itemPath,
  modulePath,
  packageDirectory,
  packageName,
  packageType = 'commonjs',
  subpath,
}: CreateEntryPointOptions): EntryPoint {
  const resolvedPath = resolve(packageDirectory, modulePath);

  return {
    moduleName: subpath ? getModuleName(packageName, subpath) : undefined,
    type: getModuleType(modulePath, packageType, condition),
    fileName: basename(resolvedPath),
    relativePath: relative(packageDirectory, resolvedPath),
    directory: dirname(resolvedPath),
    resolvedPath,
    subpath,
    condition,
    itemPath,
  };
}
