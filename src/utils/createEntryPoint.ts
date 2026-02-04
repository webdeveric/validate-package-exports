import { relative, dirname, basename } from 'node:path';

import type { EntryPoint, ItemPath, PackageContext } from '@src/types.js';

import { getModuleName } from './getModuleName.js';
import { getModuleType } from './getModuleType.js';
import { getResolvedPath } from './getResolvedPath.js';

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
  const resolvedPath = getResolvedPath(modulePath, packageContext);

  return {
    moduleName: moduleName ?? (subpath ? getModuleName(packageContext.name, subpath) : undefined),
    packageDirectory: packageContext.directory,
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
