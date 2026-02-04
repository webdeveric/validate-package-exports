import { AssertionError } from 'node:assert';
import { spawn, type SpawnOptions } from 'node:child_process';
import { once } from 'node:events';
import { relative } from 'node:path';

import { Result, ResultCode } from '@lib/Result.js';
import { ExitCode, type EntryPoint } from '@src/types.js';

export async function checkSyntax(entryPoint: EntryPoint, options: SpawnOptions): Promise<Result> {
  try {
    const check = spawn('node', ['--check', entryPoint.resolvedPath], {
      ...options,
      cwd: entryPoint.packageDirectory,
      stdio: 'inherit',
    });

    const [code]: number[] = await once(check, 'close', {
      signal: options.signal,
    });

    if (code !== ExitCode.Ok) {
      throw new AssertionError({
        message: 'exit code not ok when checking syntax',
        expected: ExitCode.Ok,
        actual: code,
      });
    }

    return new Result({
      code: ResultCode.Success,
      entryPoint,
      message: `${relative(entryPoint.packageDirectory, entryPoint.resolvedPath)} has valid syntax`,
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
