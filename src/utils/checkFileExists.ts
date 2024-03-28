import { relative } from 'node:path';

import { Result, ResultCode } from '@lib/Result.js';
import type { EntryPoint } from '@src/types.js';

import { isFile } from './isFile.js';

export async function checkFileExists(entryPoint: EntryPoint): Promise<Result> {
  try {
    if ((await isFile(entryPoint.resolvedPath)) === false) {
      throw new Error(`${entryPoint.resolvedPath} is not a file`);
    }

    return new Result({
      name: 'file-exists',
      code: ResultCode.Success,
      message: `${relative(process.cwd(), entryPoint.resolvedPath)} exists`,
      entryPoint,
    });
  } catch (error) {
    return new Result({
      name: 'file-exists',
      code: ResultCode.Error,
      entryPoint,
      message: `${relative(process.cwd(), entryPoint.resolvedPath)} does not exist`,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
