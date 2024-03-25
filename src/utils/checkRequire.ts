import { type EntryPoint, type Result, ResultCode } from '@src/types.js';

import { execRequire } from './execRequire.js';

import type { ExecOptions } from 'node:child_process';

export async function checkRequire(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      await execRequire(entryPoint.moduleName, options);

      return {
        code: ResultCode.Success,
        entryPoint,
        message: entryPoint.moduleName,
        name: 'require',
      };
    }

    return {
      code: ResultCode.Skip,
      entryPoint,
      message: `Require skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'require',
    };
  } catch (error) {
    return {
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be required`,
      name: 'require',
    };
  }
}
