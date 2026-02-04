import { AssertionError } from 'node:assert';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

const supportsImportMetaResolveParent =
  typeof import.meta.resolve === 'function' && process.execArgv.includes('--experimental-import-meta-resolve');

export function checkImport(entryPoint: EntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string' && supportsImportMetaResolveParent) {
      const resolvedPath = fileURLToPath(
        import.meta.resolve(entryPoint.moduleName, pathToFileURL(entryPoint.packagePath)),
      );

      if (resolvedPath !== entryPoint.resolvedPath) {
        throw new AssertionError({
          message: 'The resolved import path does not equal entrypoint resolved path',
          expected: entryPoint.resolvedPath,
          actual: resolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        entryPoint,
        message: `"${entryPoint.moduleName}" works with import`,
        name: 'import',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      entryPoint,
      message: `Import skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'import',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be imported`,
      name: 'import',
    });
  }
}
