import { AssertionError } from 'node:assert';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

const supportsImportMetaResolveParent =
  typeof import.meta.resolve === 'function' && process.execArgv.includes('--experimental-import-meta-resolve');

export function checkImport(entryPoint: RealEntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string' && supportsImportMetaResolveParent) {
      // If the package is symlinked, this will resolve to the real path.
      const resolvedPath = fileURLToPath(
        import.meta.resolve(entryPoint.moduleName, pathToFileURL(entryPoint.packageContext.realPath)),
      );

      if (resolvedPath !== entryPoint.realResolvedPath) {
        throw new AssertionError({
          message: 'The resolved import path does not equal entrypoint resolved path',
          expected: entryPoint.realResolvedPath,
          actual: resolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        realEntryPoint: entryPoint,
        message: `"${entryPoint.moduleName}" works with import`,
        name: 'import',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      realEntryPoint: entryPoint,
      message: `Import skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'import',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      realEntryPoint: entryPoint,
      error: asError(error),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be imported`,
      name: 'import',
    });
  }
}
