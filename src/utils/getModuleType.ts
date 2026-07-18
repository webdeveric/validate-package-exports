import { readFileSync } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { dirname } from 'node:path';

import type { PackageType } from '@src/types.js';
import { isTypeOnlyPackageJson } from '@utils/type-predicate.js';

/**
 * Node resolves a file's module type from the closest ancestor `package.json`,
 * which is not necessarily the package root (e.g. a `dist/package.json` with
 * `"type": "commonjs"` inside a `"type": "module"` package).
 */
function getNearestPackageType(directory: string): PackageType | undefined {
  try {
    const packageJsonPath = findPackageJSON(`${directory}/`, import.meta.url);

    if (!packageJsonPath) {
      return undefined;
    }

    const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    return isTypeOnlyPackageJson(packageJson) && packageJson.type === 'module' ? 'module' : 'commonjs';
  } catch {
    return undefined;
  }
}

export function getModuleType(
  path: string,
  packageType: PackageType = 'commonjs',
  condition: string[] = [],
): PackageType {
  const mostSpecificCondition = condition.at(-1);

  if (mostSpecificCondition === 'require' || path.endsWith('.cjs')) {
    return 'commonjs';
  }

  if (mostSpecificCondition === 'import' || path.endsWith('.mjs')) {
    return 'module';
  }

  return getNearestPackageType(dirname(path)) ?? packageType;
}
