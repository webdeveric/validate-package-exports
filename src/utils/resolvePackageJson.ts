import { stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export async function resolvePackageJson(input: string): Promise<string> {
  const stats = await stat(input);

  if (stats.isDirectory()) {
    return await resolvePackageJson(join(input, 'package.json'));
  }

  if (stats.isFile() && basename(input) === 'package.json') {
    return resolve(input);
  }

  throw new Error(`Unable to resolve package.json from ${input}`);
}
