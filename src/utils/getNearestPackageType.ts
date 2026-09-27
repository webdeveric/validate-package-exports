import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PackageContext, PackageType } from '@src/types.js';
import { lookupPaths } from '@utils/lookupPaths.js';
import { isTypeOnlyPackageJson } from '@utils/type-predicate.js';

const cache = new WeakMap<PackageContext, Map<string, PackageType | undefined>>();

const getCache = (packageContext: PackageContext): Map<string, PackageType | undefined> => {
  let packageCache = cache.get(packageContext);

  if (!packageCache) {
    packageCache = new Map();

    cache.set(packageContext, packageCache);
  }

  return packageCache;
};

/**
 * Node resolves a file's module type from the closest ancestor `package.json`,
 * which is not necessarily the package root (e.g. a `dist/package.json` with
 * `"type": "commonjs"` inside a `"type": "module"` package).
 */
export function getNearestPackageType(path: string, packageContext: PackageContext): PackageType | undefined {
  if (path === packageContext.directory) {
    return packageContext.type;
  }

  const packageCache = getCache(packageContext);

  for (const folder of lookupPaths(path, packageContext)) {
    const possiblePackageJsonPath = join(folder, 'package.json');
    const cachedType = packageCache.get(possiblePackageJsonPath);

    if (cachedType) {
      return cachedType;
    }

    try {
      const packageJson: unknown = JSON.parse(readFileSync(possiblePackageJsonPath, 'utf-8'));

      if (isTypeOnlyPackageJson(packageJson)) {
        packageCache.set(possiblePackageJsonPath, packageJson.type);

        return packageJson.type;
      }
    } catch {
      // Ignore errors reading or parsing package.json files
    }
  }
}
