import { describe, expect, it } from 'vitest';

import { getEntryPointsFromBin } from './getEntryPointsFromBin.js';

describe('getEntryPointsFromBin()', () => {
  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromBin(
          {
            name: 'test',
            version: '0.0.0',
            bin: './bin.js',
          },
          {
            name: 'test',
            type: 'module',
            path: './package.json',
            directory: '/tmp',
          },
        ),
      ),
    ).toEqual([
      {
        condition: undefined,
        directory: '/tmp',
        fileName: 'bin.js',
        itemPath: ['bin'],
        moduleName: undefined,
        packagePath: './package.json',
        relativePath: 'bin.js',
        resolvedPath: '/tmp/bin.js',
        subpath: undefined,
        type: 'module',
      },
    ]);

    expect(
      Array.from(
        getEntryPointsFromBin(
          {
            name: 'test',
            version: '0.0.0',
            bin: {
              tool: './tool.js',
              example: './example.js',
            },
          },
          {
            name: 'test',
            type: 'module',
            path: './package.json',
            directory: '/tmp',
          },
        ),
      ),
    ).toEqual([
      {
        condition: undefined,
        directory: '/tmp',
        fileName: 'tool.js',
        itemPath: ['bin', 'tool'],
        moduleName: undefined,
        packagePath: './package.json',
        relativePath: 'tool.js',
        resolvedPath: '/tmp/tool.js',
        subpath: undefined,
        type: 'module',
      },
      {
        condition: undefined,
        directory: '/tmp',
        fileName: 'example.js',
        itemPath: ['bin', 'example'],
        moduleName: undefined,
        packagePath: './package.json',
        relativePath: 'example.js',
        resolvedPath: '/tmp/example.js',
        subpath: undefined,
        type: 'module',
      },
    ]);
  });
});
