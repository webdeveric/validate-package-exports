import { execFile, type ExecFileOptionsWithStringEncoding } from 'node:child_process';
import { relative } from 'node:path';
import { promisify } from 'node:util';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

const execFileAsync = promisify(execFile);

/**
 * @todo use entryPoint.realRelativePath that is a branded type that proves the path exists.
 */
export async function checkSyntax(
  realEntryPoint: RealEntryPoint,
  options: Omit<ExecFileOptionsWithStringEncoding, 'cwd'>,
): Promise<Result> {
  try {
    const relativePath = relative(realEntryPoint.packageContext.directory, realEntryPoint.resolvedPath);

    await execFileAsync('node', ['--check', relativePath], {
      ...options,
      cwd: realEntryPoint.packageContext.directory,
    });

    return new Result({
      code: ResultCode.Success,
      realEntryPoint,
      message: `${relativePath} has valid syntax`,
      name: 'check-syntax',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      realEntryPoint,
      error: asError(error),
      message: `Could not validate syntax for ${relative(process.cwd(), realEntryPoint.resolvedPath)}`,
      name: 'check-syntax',
    });
  }
}
