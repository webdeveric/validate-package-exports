import { relative } from 'node:path';

import { asError } from '@webdeveric/utils/asError';

import { Result, ResultCode } from '@lib/Result.js';
import type { RealEntryPoint } from '@src/types.js';

import { isFile } from './isFile.js';

export async function checkFileExists(realEntryPoint: RealEntryPoint): Promise<Result> {
  try {
    if ((await isFile(realEntryPoint.resolvedPath)) === false) {
      throw new Error(`${realEntryPoint.resolvedPath} is not a file`);
    }

    return new Result({
      name: 'file-exists',
      code: ResultCode.Success,
      message: `${relative(process.cwd(), realEntryPoint.resolvedPath)} exists`,
      realEntryPoint,
    });
  } catch (error) {
    return new Result({
      name: 'file-exists',
      code: ResultCode.Error,
      realEntryPoint,
      message: `${relative(process.cwd(), realEntryPoint.resolvedPath)} does not exist`,
      error: asError(error),
    });
  }
}
