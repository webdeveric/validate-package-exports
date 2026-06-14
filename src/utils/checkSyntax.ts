import { AssertionError } from 'node:assert';
import { spawn, type SpawnOptions } from 'node:child_process';
import { once } from 'node:events';
import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import { ExitCode, type RealEntryPoint } from '@src/types.js';

export async function checkSyntax(realEntryPoint: RealEntryPoint, options: SpawnOptions): Promise<Result> {
  try {
    const check = spawn('node', ['--check', realEntryPoint.resolvedPath], {
      ...options,
      cwd: realEntryPoint.packageContext.directory,
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
      realEntryPoint,
      message: `${relative(realEntryPoint.packageContext.directory, realEntryPoint.resolvedPath)} has valid syntax`,
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
