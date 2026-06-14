import type { Result } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

import { checkImport } from './checkImport.js';
import { checkRequire } from './checkRequire.js';

export function shouldRequire(realEntryPoint: RealEntryPoint): boolean {
  if (realEntryPoint.itemPath.length === 1) {
    const firstPath = realEntryPoint.itemPath[0];

    if (firstPath === 'module' && realEntryPoint.type === 'module') {
      return false;
    }

    if (firstPath === 'main' || firstPath === 'exports') {
      return realEntryPoint.type !== 'module';
    }
  }

  return typeof realEntryPoint.condition === 'undefined' || realEntryPoint.condition === 'require';
}

export function shouldImport(realEntryPoint: RealEntryPoint): boolean {
  if (realEntryPoint.itemPath.length === 1) {
    const firstPath = realEntryPoint.itemPath[0];

    if (firstPath === 'main' && realEntryPoint.type === 'commonjs') {
      return false;
    }

    if (firstPath === 'main' || firstPath === 'exports') {
      return realEntryPoint.type !== 'commonjs';
    }
  }

  return typeof realEntryPoint.condition === 'undefined' || realEntryPoint.condition === 'import';
}

export function verifyEntryPoint(realEntryPoint: RealEntryPoint): Result[] {
  const results: Result[] = [];

  if (typeof realEntryPoint.moduleName === 'string') {
    if (shouldRequire(realEntryPoint)) {
      results.push(checkRequire(realEntryPoint));
    }

    if (shouldImport(realEntryPoint)) {
      results.push(checkImport(realEntryPoint));
    }
  }

  return results;
}
