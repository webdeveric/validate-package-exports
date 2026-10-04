import { relative } from 'node:path';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

export function verifyStrictModuleType(entryPoint: EntryPoint): Result {
  const lastCondition = entryPoint.condition.at(-1);
  const relativePath = relative(entryPoint.packageContext.directory, entryPoint.resolvedPath);

  if (lastCondition === 'require' && entryPoint.type === 'module') {
    return new Result({
      name: 'strict-module-type',
      code: ResultCode.Error,
      message: `Module "${relativePath}" is type="module", but should be type="commonjs"`,
      entryPoint,
    });
  }

  if ((lastCondition === 'import' || lastCondition === 'module-sync') && entryPoint.type === 'commonjs') {
    return new Result({
      name: 'strict-module-type',
      code: ResultCode.Error,
      message: `Module "${relativePath}" is type="commonjs", but should be type="module"`,
      entryPoint,
    });
  }

  return lastCondition
    ? new Result({
        name: 'strict-module-type',
        code: ResultCode.Success,
        message: `Module "${relativePath}" is type="${entryPoint.type}"`,
        entryPoint,
      })
    : new Result({
        name: 'strict-module-type',
        code: ResultCode.Skip,
        message: `No condition found for "${relativePath}"`,
        entryPoint,
      });
}
