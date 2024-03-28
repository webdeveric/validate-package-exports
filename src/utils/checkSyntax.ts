import { relative } from 'node:path';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { asyncExec } from './asyncExec.js';

import type { ExecOptions } from 'node:child_process';

export async function checkSyntax(entryPoint: EntryPoint, options: ExecOptions): Promise<Result> {
  try {
    await asyncExec(`node --check ${entryPoint.resolvedPath}`, options);

    return new Result({
      code: ResultCode.Success,
      entryPoint,
      message: `${relative(process.cwd(), entryPoint.resolvedPath)} has valid syntax`,
      name: 'check-syntax',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: error instanceof Error ? error : new Error(String(error)),
      message: `Could not validate syntax for ${relative(process.cwd(), entryPoint.resolvedPath)}`,
      name: 'check-syntax',
    });
  }
}
