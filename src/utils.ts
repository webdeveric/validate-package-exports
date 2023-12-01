import { readFile } from 'node:fs/promises';

import { assertIsPackageJson } from '@src/type-assertion.js';
import type { PackageJson } from '@src/types.js';

export function getNodeMajorVersion(): number {
  return Number(process.versions.node.split('.').at(0));
}

export async function readJson(path: string): Promise<unknown> {
  const contents = await readFile(path, 'utf-8');

  return JSON.parse(contents);
}

/**
 * @see https://nodejs.org/api/esm.html#import-attributes
 */
export async function importJson<Type = unknown>(path: string): Promise<Type> {
  return (
    getNodeMajorVersion() >= 21
      ? await import(path, {
          with: {
            type: 'json',
          },
        } as unknown as ImportCallOptions)
      : await import(path, {
          assert: {
            type: 'json',
          },
        })
  ).default;
}

export async function importPackageJson(path: string): Promise<PackageJson> {
  const data = await readJson(path);

  assertIsPackageJson(data);

  return data;
}
