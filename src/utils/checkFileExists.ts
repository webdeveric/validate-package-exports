import { relative } from 'node:path';

import { ResultCode, type EntryPoint, type Result } from '@src/types.js';

import { isFile } from './isFile.js';

export async function checkFileExists(entryPoint: EntryPoint): Promise<Result> {
  try {
    if ((await isFile(entryPoint.resolvedPath)) === false) {
      throw new Error(`${entryPoint.resolvedPath} is not a file`);
    }

    return {
      name: 'file-exists',
      code: ResultCode.Success,
      message: relative(process.cwd(), entryPoint.resolvedPath),
      entryPoint,
    };
  } catch (error) {
    return {
      name: 'file-exists',
      code: ResultCode.Error,
      entryPoint,
      message: relative(process.cwd(), entryPoint.resolvedPath),
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
