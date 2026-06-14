import { AssertionError } from 'node:assert';
import { createRequire } from 'node:module';
import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';
import { memo } from '@webdeveric/utils/memo';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

const getRequire = memo(createRequire);

export function checkRequire(realEntryPoint: RealEntryPoint): Result {
  try {
    if (typeof realEntryPoint.moduleName === 'string') {
      const require = getRequire(realEntryPoint.packageContext.path);

      // If the package is symlinked, this will resolve to the real path.
      const resolvedPath = require.resolve(realEntryPoint.moduleName, {
        paths: [realEntryPoint.packageContext.realDirectory],
      });

      if (resolvedPath !== realEntryPoint.realResolvedPath) {
        throw new AssertionError({
          message: `The resolved require path (${relative(process.cwd(), resolvedPath)}) does not equal entrypoint resolved path (${relative(process.cwd(), realEntryPoint.realResolvedPath)}).`,
          expected: realEntryPoint.realResolvedPath,
          actual: resolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        realEntryPoint,
        message: `"${realEntryPoint.moduleName}" works with require`,
        name: 'require',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      realEntryPoint,
      message: `Require skipped: ${realEntryPoint.itemPath.join('.')}`,
      name: 'require',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      realEntryPoint,
      error: asError(error),
      message: `${realEntryPoint.moduleName ?? realEntryPoint.itemPath.join('.')} cannot be required`,
      name: 'require',
    });
  }
}
