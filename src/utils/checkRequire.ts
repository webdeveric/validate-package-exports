import { AssertionError } from 'node:assert';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';
import { memo } from '@webdeveric/utils/memo';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

const getRequire = memo(createRequire);

export function checkRequire(entryPoint: EntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      const require = getRequire(entryPoint.packageContext.path);

      // If the package is symlinked, this will resolve to the real path.
      const requireResolvedPath = require.resolve(entryPoint.moduleName, {
        paths: [entryPoint.packageContext.realDirectory],
      });

      const realResolvedPath = realpathSync(entryPoint.resolvedPath);

      if (requireResolvedPath !== realResolvedPath) {
        throw new AssertionError({
          message: `The resolved require path (${relative(process.cwd(), requireResolvedPath)}) does not equal entrypoint resolved path (${relative(process.cwd(), realResolvedPath)}).`,
          expected: realResolvedPath,
          actual: requireResolvedPath,
        });
      }

      return new Result({
        code: ResultCode.Success,
        entryPoint,
        message: `"${entryPoint.moduleName}" works with require`,
        name: 'require',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      entryPoint,
      message: `Require skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'require',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: asError(error),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be required`,
      name: 'require',
    });
  }
}
