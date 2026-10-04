import { AssertionError } from 'node:assert';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { requireResolveWithConditions } from './resolveWithConditions.js';

export function checkRequire(entryPoint: EntryPoint): Result {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      const requireResolvedPath = requireResolveWithConditions(
        createRequire(entryPoint.packageContext.path),
        entryPoint.moduleName,
        {
          paths: [entryPoint.packageContext.realDirectory],
        },
        entryPoint.condition.length > 0 ? entryPoint.condition : undefined,
      );

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
        message: `"${entryPoint.moduleName}" works with require.`,
        name: 'require',
      });
    }

    return new Result({
      code: ResultCode.Skip,
      entryPoint,
      message: `"${entryPoint.moduleName}" skipped.`,
      name: 'require',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: asError(error),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be required.`,
      name: 'require',
    });
  }
}
