import { dirname } from 'node:path';

import type { PackageContext, PackageJson } from '@src/types.js';

export type CreatePackageContextOptions = {
  /**
   * Path to `package.json`
   */
  resolvedPath: string;
  /**
   * Real path to `package.json`
   */
  realPath: string;
  /**
   * Parsed `package.json` data
   */
  packageJson: PackageJson;
  /**
   * Raw `package.json` data
   */
  rawPackageJson: string;
};

export function createPackageContext(options: CreatePackageContextOptions): PackageContext {
  const packageContext: PackageContext = Object.freeze(
    Object.defineProperties(
      {
        name: options.packageJson.name,
        version: options.packageJson.version,
        type: options.packageJson.type ?? 'commonjs',
        path: options.resolvedPath,
        realPath: options.realPath,
        directory: dirname(options.resolvedPath),
        realDirectory: dirname(options.realPath),
        getSource: () => options.rawPackageJson,
        getData: () => options.packageJson,
      },
      {
        getSource: {
          enumerable: false,
        },
        getData: {
          enumerable: false,
        },
      },
    ),
  );

  return packageContext;
}
