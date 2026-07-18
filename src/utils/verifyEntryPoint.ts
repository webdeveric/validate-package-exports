import type { Result } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { checkImport } from './checkImport.js';
import { checkRequire } from './checkRequire.js';

export function shouldRequire(entryPoint: EntryPoint): boolean {
  if (entryPoint.itemPath.length === 1) {
    const firstPath = entryPoint.itemPath[0];

    if (firstPath === 'module' && entryPoint.type === 'module') {
      return false;
    }

    if (firstPath === 'main' || firstPath === 'exports') {
      return entryPoint.type !== 'module';
    }
  }

  return entryPoint.condition.length === 0 || entryPoint.condition.at(-1) === 'require';
}

export function shouldImport(entryPoint: EntryPoint): boolean {
  if (entryPoint.itemPath.length === 1) {
    const firstPath = entryPoint.itemPath[0];

    if (firstPath === 'main' && entryPoint.type === 'commonjs') {
      return false;
    }

    if (firstPath === 'main' || firstPath === 'exports') {
      return entryPoint.type !== 'commonjs';
    }
  }

  return entryPoint.condition.length === 0 || entryPoint.condition.at(-1) === 'import';
}

export function verifyEntryPoint(entryPoint: EntryPoint): Result[] {
  const results: Result[] = [];

  if (typeof entryPoint.moduleName === 'string') {
    if (shouldRequire(entryPoint)) {
      results.push(checkRequire(entryPoint));
    }

    if (shouldImport(entryPoint)) {
      results.push(checkImport(entryPoint));
    }
  }

  return results;
}
