import type { PackageContext, PackageType } from '@src/types.js';
import { getNearestPackageType } from '@utils/getNearestPackageType.js';

/**
 * Returns the module type of a file based on its extension and the nearest package.json's `type` property.
 */
export function getModuleType(path: string, packageContext: PackageContext): PackageType {
  if (path.endsWith('.cjs')) {
    return 'commonjs';
  }

  if (path.endsWith('.mjs')) {
    return 'module';
  }

  return getNearestPackageType(path, packageContext) ?? packageContext.type;
}
