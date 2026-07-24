import { AssertionError } from 'node:assert';
import { realpathSync } from 'node:fs';
import { relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { resolveWithConditions } from './resolveWithConditions.js';

const supportsImportMetaResolveParent =
  typeof import.meta.resolve === 'function' && process.execArgv.includes('--experimental-import-meta-resolve');

export function checkImport(entryPoint: EntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string' && supportsImportMetaResolveParent) {
      const importResolvedPath = fileURLToPath(
        resolveWithConditions(
          entryPoint.moduleName,
          pathToFileURL(entryPoint.packageContext.realPath),
          entryPoint.condition.length > 0 ? entryPoint.condition : undefined,
        ),
      );

      const realResolvedPath = realpathSync(entryPoint.resolvedPath);

      if (importResolvedPath !== realResolvedPath) {
        throw new AssertionError({
          message: `The resolved import path (${relative(process.cwd(), importResolvedPath)}) does not equal entrypoint resolved path (${relative(process.cwd(), realResolvedPath)}).`,
          expected: realResolvedPath,
          actual: importResolvedPath,
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
      message: `"${entryPoint.moduleName}" skipped`,
      name: 'import',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: asError(error),
      message: `${entryPoint.moduleName ?? entryPoint.relativePath} cannot be imported`,
      name: 'import',
    });
  }
}
