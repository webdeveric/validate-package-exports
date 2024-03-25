import { type EntryPoint, type Result, ResultCode } from '@src/types.js';

import { execImport } from './execImport.js';

import type { ExecOptions } from 'node:child_process';

export async function checkImport(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    if (typeof entryPoint.moduleName === 'string') {
      await execImport(entryPoint.moduleName, options);

      return {
        code: ResultCode.Success,
        entryPoint,
        message: entryPoint.moduleName,
        name: 'import',
      };
    }

    return {
      code: ResultCode.Skip,
      entryPoint,
      message: `Import skipped: ${entryPoint.itemPath.join('.')}`,
      name: 'import',
    };
  } catch (error) {
    return {
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: `${entryPoint.moduleName ?? entryPoint.itemPath.join('.')} cannot be imported`,
      name: 'import',
    };
  }
}
