import { type Result, ResultCode, type EntryPoint } from '@src/types.js';

import { asyncExec } from './asyncExec.js';

import type { ExecOptions } from 'node:child_process';

export async function checkSyntax(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    await asyncExec(`node --check ${entryPoint.resolvedPath}`, options);

    return {
      code: ResultCode.Success,
      entryPoint,
      message: entryPoint.resolvedPath,
      name: 'check-syntax',
    };
  } catch (error) {
    return {
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: entryPoint.resolvedPath,
      name: 'check-syntax',
    };
  }
}
