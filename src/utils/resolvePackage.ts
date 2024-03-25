import assert from 'node:assert';
import { stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function resolvePackage(packagePath: string | undefined): Promise<string> {
  assert(packagePath, 'package path not defined');

  try {
    const path = resolve(packagePath);

    const stats = await stat(packagePath);

    if (stats.isFile()) {
      return path;
    }

    if (stats.isDirectory()) {
      return resolvePackage(join(path, 'package.json'));
    }

    throw new Error('package path is not a file or directory');
  } catch (error) {
    const mainPath = await import.meta.resolve(packagePath);

    // TODO: Search for package.json starting from `mainPath` then go up each directory.

    return mainPath;
  }
}
