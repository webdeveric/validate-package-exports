import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Result, ResultCode } from './Result.js';

describe('Result', () => {
  it('Uses name for Symbol.toStringTag', () => {
    const result = new Result({
      name: 'file-exists',
      code: ResultCode.Success,
      message: 'message',
      entryPoint: {
        moduleName: undefined,
        type: 'module',
        fileName: 'index.js',
        relativePath: './index.js',
        directory: resolve('/tmp'),
        resolvedPath: '/tmp/index.js',
        subpath: undefined,
        condition: [],
        itemPath: ['main'],
        packageContext: {
          name: 'example',
          type: 'module',
          path: 'package.json',
          realPath: 'package.json',
          directory: '/tmp',
          realDirectory: '/tmp',
        },
      },
    });

    expect(result[Symbol.toStringTag]).toBe('Result:file-exists');
    expect(Object.prototype.toString.call(result)).toBe('[object Result:file-exists]');
  });
});
