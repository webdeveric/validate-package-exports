import { stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import type { PackageJsonPath } from '@src/types.js';

/**
 * Normalizes the path to a `package.json` file.
 */
export function normalizePackageJsonPath(input: string): PackageJsonPath {
  return resolve(input) as PackageJsonPath;
}

/**
 * Resolves the path to a `package.json` file from a given input path.
 */
export async function resolvePackageJson(input: string): Promise<PackageJsonPath> {
  const stats = await stat(input);

  if (stats.isDirectory()) {
    return await resolvePackageJson(join(input, 'package.json'));
  }

  if (stats.isFile()) {
    if (basename(input) === 'package.json') {
      return normalizePackageJsonPath(input);
    }

    return await resolvePackageJson(dirname(input));
  }

  throw new Error(`Unable to resolve package.json from ${input}`);
}
