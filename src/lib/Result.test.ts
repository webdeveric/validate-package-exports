import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Result, ResultCode } from './Result.js';

describe('Result', () => {
  it('Holds data describing what happened', () => {
    const result = new Result({
      name: 'file-exists',
      code: ResultCode.Success,
      message: 'message',
      realEntryPoint: {
        moduleName: undefined,
        type: 'module',
        fileName: 'index.js',
        relativePath: './index.js',
        directory: resolve('/tmp'),
        realDirectory: resolve('/tmp'),
        resolvedPath: '/tmp/index.js',
        realResolvedPath: '/tmp/index.js',
        subpath: undefined,
        condition: undefined,
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

    expect(result.toString()).toEqual('✅ file-exists: message');

    result.code = ResultCode.Error;

    expect(result.toString()).toEqual('❌ file-exists: message (["main"])');

    result.code = ResultCode.Skip;

    expect(result.toString()).toEqual('😐 file-exists: message');
  });
});
