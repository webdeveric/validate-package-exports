import type { Result } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { checkImport } from './checkImport.js';
import { checkRequire } from './checkRequire.js';

import type { ExecOptions } from 'node:child_process';

export function shouldRequire(entryPoint: EntryPoint): boolean {
  if (entryPoint.type === 'module' && entryPoint.itemPath.length === 1 && entryPoint.itemPath[0] === 'main') {
    return false;
  }

  return typeof entryPoint.condition === 'undefined' || entryPoint.condition === 'require';
}

export function shouldImport(entryPoint: EntryPoint): boolean {
  return typeof entryPoint.condition === 'undefined' || entryPoint.condition === 'import';
}

export async function verifyEntryPoint(entryPoint: EntryPoint, options: ExecOptions): Promise<Result[]> {
  const results: Result[] = [];

  try {
    if (typeof entryPoint.moduleName === 'string') {
      if (shouldRequire(entryPoint)) {
        results.push(await checkRequire(entryPoint, options));
      }

      if (shouldImport(entryPoint)) {
        results.push(await checkImport(entryPoint, options));
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Unable to verify "${entryPoint.moduleName}"`, { cause: error });
    }
  }

  return results;
}
