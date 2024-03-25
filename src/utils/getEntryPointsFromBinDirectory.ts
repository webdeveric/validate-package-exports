import { opendir } from 'node:fs/promises';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { resolveDirent } from './resolveDirent.js';

export async function* getEntryPointsFromBinDirectory(
  packageJson: PackageJson,
  packageDirectory: string,
): AsyncGenerator<EntryPoint> {
  if (typeof packageJson.directories?.bin === 'string') {
    const binDir = await opendir(packageJson.directories.bin);

    for await (const item of binDir) {
      if (item.isFile()) {
        yield createEntryPoint({
          condition: undefined,
          itemPath: ['directories', 'bin'],
          modulePath: resolveDirent(item),
          packageDirectory,
          packageName: packageJson.name,
          packageType: packageJson.type,
          subpath: undefined,
        });
      }
    }
  }
}
