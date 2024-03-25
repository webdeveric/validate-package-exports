import type { PackageJson } from '@src/types.js';
import { assertIsPackageJson } from '@utils/type-assertion.js';

import { readJson } from './readJson.js';

export async function importPackageJson(path: string): Promise<PackageJson> {
  const data = await readJson(path);

  assertIsPackageJson(data);

  return data;
}
