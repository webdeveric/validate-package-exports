import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromMain(
  packageJson: PackageJson,
  packageContext: PackageContext,
): Generator<EntryPoint> {
  if (packageJson.main) {
    yield createEntryPoint({
      moduleName: packageContext.name,
      condition: undefined,
      itemPath: ['main'],
      modulePath: packageJson.main,
      packageContext,
      subpath: undefined,
    });
  }
}
