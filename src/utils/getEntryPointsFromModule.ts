import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromModule(
  packageJson: PackageJson,
  packageContext: PackageContext,
): Generator<EntryPoint> {
  if (packageJson.module) {
    yield createEntryPoint({
      moduleName: packageContext.name,
      condition: undefined,
      itemPath: ['module'],
      modulePath: packageJson.module,
      packageContext,
      subpath: undefined,
    });
  }
}
