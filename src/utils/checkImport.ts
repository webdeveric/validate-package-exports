import { AssertionError } from 'node:assert';
import { relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

const supportsImportMetaResolveParent =
  typeof import.meta.resolve === 'function' && process.execArgv.includes('--experimental-import-meta-resolve');

export function checkImport(realEntryPoint: RealEntryPoint): Result {
  try {
    if (typeof realEntryPoint.moduleName === 'string' && supportsImportMetaResolveParent) {
      // If the package is symlinked, this will resolve to the real path.
      const resolvedPath = fileURLToPath(
        import.meta.resolve(realEntryPoint.moduleName, pathToFileURL(realEntryPoint.packageContext.realPath)),
      );

      if (resolvedPath !== realEntryPoint.realResolvedPath) {
        throw new AssertionError({
          message: `The resolved import path (${relative(process.cwd(), resolvedPath)}) does not equal entrypoint resolved path (${relative(process.cwd(), realEntryPoint.realResolvedPath)}).`,
          expected: realEntryPoint.realResolvedPath,
          actual: resolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        realEntryPoint,
        message: `"${realEntryPoint.moduleName}" works with import`,
        name: 'import',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      realEntryPoint,
      message: `Import skipped: ${realEntryPoint.itemPath.join('.')}`,
      name: 'import',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      realEntryPoint,
      error: asError(error),
      message: `${realEntryPoint.moduleName ?? realEntryPoint.itemPath.join('.')} cannot be imported`,
      name: 'import',
    });
  }
}
