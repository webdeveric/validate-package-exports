import { AssertionError } from 'node:assert';
import { createRequire } from 'node:module';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { memo } from './memo.js';

const getRequire = memo(createRequire);

export function checkRequire(entryPoint: EntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      const require = getRequire(entryPoint.packagePath);

      const resolvedPath = require.resolve(entryPoint.moduleName, {
        paths: [entryPoint.packageDirectory],
      });

      if (resolvedPath !== entryPoint.resolvedPath) {
        throw new AssertionError({
          message: 'The resolved require path does not equal entrypoint resolved path',
          expected: entryPoint.resolvedPath,
          actual: resolvedPath,
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
      error: error instanceof Error ? error : new Error(String(error)),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be required`,
      name: 'require',
    });
  }
}
