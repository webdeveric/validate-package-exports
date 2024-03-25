import type { EntryPoint, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromModule(packageJson: PackageJson, packageDirectory: string): Generator<EntryPoint> {
  if (packageJson.module) {
    yield createEntryPoint({
      condition: undefined,
      itemPath: ['module'],
      modulePath: packageJson.module,
      packageDirectory,
      packageName: packageJson.name,
      packageType: packageJson.type,
      subpath: '.',
    });
  }
}
