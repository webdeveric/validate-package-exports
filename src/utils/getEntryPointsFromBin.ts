import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { normalizeBin } from './normalizeBin.js';

export function* getEntryPointsFromBin(
  packageJson: PackageJson,
  packageContext: PackageContext,
): Generator<EntryPoint> {
  if (packageJson.bin) {
    for (const [key, path] of Object.entries(normalizeBin(packageJson.bin, packageJson.name))) {
      yield createEntryPoint({
        condition: undefined,
        itemPath: typeof packageJson.bin === 'string' ? ['bin'] : ['bin', key],
        modulePath: path,
        packageContext,
        subpath: undefined,
      });
    }
  }
}
