import { execFile, type ExecFileOptionsWithStringEncoding } from 'node:child_process';
import { relative } from 'node:path';
import { promisify } from 'node:util';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

const execFileAsync = promisify(execFile);

/**
 * @todo use entryPoint.realRelativePath that is a branded type that proves the path exists.
 */
export async function checkSyntax(
  entryPoint: EntryPoint,
  options: Omit<ExecFileOptionsWithStringEncoding, 'cwd'>,
): Promise<Result> {
  try {
    const relativePath = relative(entryPoint.packageContext.directory, entryPoint.resolvedPath);

    await execFileAsync('node', ['--check', relativePath], {
      ...options,
      cwd: entryPoint.packageContext.directory,
    });

    return new Result({
      code: ResultCode.Success,
      entryPoint,
      message: `${relativePath} has valid syntax`,
      name: 'check-syntax',
    });
  } catch (error) {
    return new Result({
      code: ResultCode.Error,
      entryPoint,
      error: asError(error),
      message: `Could not validate syntax for ${relative(process.cwd(), entryPoint.resolvedPath)}`,
      name: 'check-syntax',
    });
  }
}
