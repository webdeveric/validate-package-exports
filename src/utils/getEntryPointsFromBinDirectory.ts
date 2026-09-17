import { opendir } from 'node:fs/promises';
import { join } from 'node:path';

import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { getResolvedPath } from './getResolvedPath.js';

// TODO: validate only `bin` or `directories.bin` can exist, not both.

export async function* getEntryPointsFromBinDirectory(
  packageJson: PackageJson,
  packageContext: PackageContext,
): AsyncGenerator<EntryPoint> {
  if (typeof packageJson.directories?.bin === 'string') {
    const binDir = await opendir(getResolvedPath(packageJson.directories.bin, packageContext));

    for await (const item of binDir) {
      if (item.isFile()) {
        yield createEntryPoint({
          condition: [],
          itemPath: ['directories', 'bin'],
          modulePath: join(packageJson.directories.bin, item.name),
          packageContext,
          subpath: undefined,
        });
      }
    }
  }
}
