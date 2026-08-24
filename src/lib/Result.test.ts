import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { PackageJson } from '@src/types.js';
import { createPackageContext } from '@utils/createPackageContext.js';

import { Result, ResultCode } from './Result.js';

describe('Result', () => {
  it('Uses name for Symbol.toStringTag', () => {
    const mockPackageJson = {
      name: 'example',
      type: 'module',
      version: '0.0.0',
      main: './index.js',
    } satisfies PackageJson;

    const result = new Result({
      name: 'file-exists',
      code: ResultCode.Success,
      message: 'message',
      entryPoint: {
        moduleName: undefined,
        type: mockPackageJson.type,
        fileName: 'index.js',
        relativePath: './index.js',
        directory: resolve('/tmp'),
        resolvedPath: '/tmp/index.js',
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext: createPackageContext({
          resolvedPath: resolve('/tmp/package.json'),
          realPath: resolve('/tmp/package.json'),
          packageJson: mockPackageJson,
          rawPackageJson: JSON.stringify(mockPackageJson),
        }),
      },
    });

    expect(result[Symbol.toStringTag]).toBe('Result:file-exists');
    expect(Object.prototype.toString.call(result)).toBe('[object Result:file-exists]');
  });
});
