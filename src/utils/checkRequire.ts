import { AssertionError } from 'node:assert';
import { createRequire } from 'node:module';
import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';
import { memo } from '@webdeveric/utils/memo';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

const getRequire = memo(createRequire);

export function checkRequire(entryPoint: RealEntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      const require = getRequire(entryPoint.packageContext.path);

      // If the package is symlinked, this will resolve to the real path.
      const resolvedPath = require.resolve(entryPoint.moduleName, {
        paths: [entryPoint.packageContext.realDirectory],
      });

      if (resolvedPath !== entryPoint.realResolvedPath) {
        throw new AssertionError({
          message: `The resolved require path (${relative(process.cwd(), resolvedPath)}) does not equal entrypoint resolved path (${relative(process.cwd(), entryPoint.realResolvedPath)}).`,
          expected: entryPoint.realResolvedPath,
          actual: resolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        realEntryPoint: entryPoint,
        message: `"${entryPoint.moduleName}" works with require`,
        name: 'require',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      realEntryPoint: entryPoint,
      message: `Require skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'require',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      realEntryPoint: entryPoint,
      error: asError(error),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be required`,
      name: 'require',
    });
  }
}
