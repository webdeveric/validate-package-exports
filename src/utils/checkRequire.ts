import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { execRequire } from './execRequire.js';

import type { ExecOptions } from 'node:child_process';

export async function checkRequire(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      await execRequire(entryPoint.moduleName, options);

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
