import { dirname, resolve } from 'node:path';

import type { PackageContext } from '@src/types.js';

/**
 * From the staring point of a file, yield the paths of all ancestor directories up to the package root.
 *
 * @internal
 */
export function* lookupPaths(path: string, packageContext: PackageContext): Generator<string> {
  let currentDir = dirname(path);

  while (currentDir.startsWith(packageContext.directory)) {
    yield currentDir;

    const parentDir = resolve(currentDir, '..');

    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }
}
