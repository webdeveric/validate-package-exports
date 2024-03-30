import { relative, dirname, basename, resolve } from 'node:path';

import type { EntryPoint, ItemPath, PackageContext } from '@src/types.js';

import { getModuleName } from './getModuleName.js';
import { getModuleType } from './getModuleType.js';

export type CreateEntryPointOptions = {
  moduleName?: string;
  modulePath: string;
  packageContext: PackageContext;
  subpath: string | undefined;
  itemPath: ItemPath;
  condition?: string | undefined;
};

export function createEntryPoint({
  moduleName,
  modulePath,
  packageContext,
  subpath,
  itemPath,
  condition,
}: CreateEntryPointOptions): EntryPoint {
  const resolvedPath = resolve(packageContext.directory, modulePath);

  return {
    moduleName: moduleName ?? (subpath ? getModuleName(packageContext.name, subpath) : undefined),
    packagePath: packageContext.path,
    type: getModuleType(modulePath, packageContext.type, condition),
    fileName: basename(resolvedPath),
    relativePath: relative(packageContext.directory, resolvedPath),
    directory: dirname(resolvedPath),
    resolvedPath,
    subpath,
    condition,
    itemPath,
  };
}
