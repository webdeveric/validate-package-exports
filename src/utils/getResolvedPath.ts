import { resolve } from 'node:path';

import type { PackageContext } from '@src/types.js';

export function getResolvedPath(modulePath: string, packageContext: PackageContext): string {
  return resolve(packageContext.directory, modulePath);
}
