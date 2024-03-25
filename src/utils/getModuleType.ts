import type { PackageType } from '@src/types.js';

export function getModuleType(
  path: string,
  packageType: PackageType = 'commonjs',
  condition?: string | undefined,
): PackageType {
  if (condition === 'require' || path.endsWith('.cjs')) {
    return 'commonjs';
  }

  if (condition === 'import' || path.endsWith('.mjs')) {
    return 'module';
  }

  return packageType;
}
