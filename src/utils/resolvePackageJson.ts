import { stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import type { PackageJsonPath } from '@src/types.js';

export async function resolvePackageJson(input: string): Promise<PackageJsonPath> {
  const stats = await stat(input);

  if (stats.isDirectory()) {
    return await resolvePackageJson(join(input, 'package.json'));
  }

  if (stats.isFile() && basename(input) === 'package.json') {
    return resolve(input) as PackageJsonPath;
  }

  throw new Error(`Unable to resolve package.json from ${input}`);
}
