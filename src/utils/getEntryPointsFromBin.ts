import type { EntryPoint, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { normalizeBin } from './normalizeBin.js';

export function* getEntryPointsFromBin(packageJson: PackageJson, packageDirectory: string): Generator<EntryPoint> {
  if (packageJson.bin) {
    for (const [key, path] of Object.entries(normalizeBin(packageJson.bin, packageJson.name))) {
      yield createEntryPoint({
        condition: undefined,
        itemPath: typeof packageJson.bin === 'string' ? ['bin'] : ['bin', key],
        modulePath: path,
        packageDirectory,
        packageName: packageJson.name,
        packageType: packageJson.type,
        subpath: undefined,
      });
    }
  }
}
