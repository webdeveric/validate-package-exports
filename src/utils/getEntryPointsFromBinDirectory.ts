import { opendir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

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
          modulePath: resolve(packageJson.directories.bin, item.name),
          packageContext,
          subpath: undefined,
        });
      }
    }
  }
}
