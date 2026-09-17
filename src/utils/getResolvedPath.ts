import { resolve } from 'node:path';

import type { PackageContext } from '@src/types.js';

/**
 * Resolves a module path relative to the package context's directory.
 */
export function getResolvedPath(modulePath: string, packageContext: PackageContext): string {
  return resolve(packageContext.directory, modulePath);
}
