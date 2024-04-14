import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';

import type { PackageContext } from '@src/types.js';

import { memo } from './memo.js';

const getRequire = memo(createRequire);

export function getResolvedPath(modulePath: string, packageContext: PackageContext): string {
  const resolvedPath = resolve(packageContext.directory, modulePath);

  if (packageContext.type === 'commonjs') {
    try {
      const require = getRequire(packageContext.directory);

      const cjsResolvedPath = require.resolve(resolvedPath);

      return join(dirname(resolvedPath), basename(cjsResolvedPath));
    } catch {
      // This may fail if the file does not exist.
      // Ignore this error because we want to handle it in the file-exists check.
    }
  }

  return resolvedPath;
}
