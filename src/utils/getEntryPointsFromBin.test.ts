import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint } from '@src/types.js';

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
        directory: resolve('/tmp'),
        fileName: 'bin.js',
        itemPath: ['bin'],
        moduleName: undefined,
        packagePath: './package.json',
        packageDirectory: '/tmp',
        relativePath: 'bin.js',
        resolvedPath: resolve('/tmp/bin.js'),
        subpath: undefined,
        type: 'module',
      },
    ] satisfies EntryPoint[]);

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
            directory: resolve('/tmp'),
          },
        ),
      ),
    ).toEqual([
      {
        condition: undefined,
        directory: resolve('/tmp'),
        fileName: 'tool.js',
        itemPath: ['bin', 'tool'],
        moduleName: undefined,
        packagePath: './package.json',
        packageDirectory: '/tmp',
        relativePath: 'tool.js',
        resolvedPath: resolve('/tmp/tool.js'),
        subpath: undefined,
        type: 'module',
      },
      {
        condition: undefined,
        directory: resolve('/tmp'),
        fileName: 'example.js',
        itemPath: ['bin', 'example'],
        moduleName: undefined,
        packagePath: './package.json',
        packageDirectory: '/tmp',
        relativePath: 'example.js',
        resolvedPath: resolve('/tmp/example.js'),
        subpath: undefined,
        type: 'module',
      },
    ] satisfies EntryPoint[]);
  });
});
