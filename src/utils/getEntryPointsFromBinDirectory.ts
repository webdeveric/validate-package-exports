import { opendir } from 'node:fs/promises';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { resolveDirent } from './resolveDirent.js';

export async function* getEntryPointsFromBinDirectory(
  packageJson: PackageJson,
  packageContext: PackageContext,
): AsyncGenerator<EntryPoint> {
  if (typeof packageJson.directories?.bin === 'string') {
    const binDir = await opendir(packageJson.directories.bin);

    for await (const item of binDir) {
      if (item.isFile()) {
        yield createEntryPoint({
          condition: undefined,
          itemPath: ['directories', 'bin'],
          modulePath: resolveDirent(item),
          packageContext,
          subpath: undefined,
        });
      }
    }
  }
}
