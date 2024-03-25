import type { EntryPoint, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromMain(packageJson: PackageJson, packageDirectory: string): Generator<EntryPoint> {
  if (packageJson.main) {
    yield createEntryPoint({
      condition: undefined,
      itemPath: ['main'],
      modulePath: packageJson.main,
      packageDirectory,
      packageName: packageJson.name,
      packageType: packageJson.type,
      subpath: '.',
    });
  }
}
