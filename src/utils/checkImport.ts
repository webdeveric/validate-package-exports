import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { execImport } from './execImport.js';

import type { ExecOptions } from 'node:child_process';

export async function checkImport(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      await execImport(entryPoint.moduleName, options);

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
      message: `Import skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'import',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be imported`,
      name: 'import',
    });
  }
}
