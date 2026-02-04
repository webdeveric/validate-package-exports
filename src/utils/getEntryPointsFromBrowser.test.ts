import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint } from '@src/types.js';

import { getEntryPointsFromBrowser } from './getEntryPointsFromBrowser.js';

describe('getEntryPointsFromBrowser()', () => {
  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromBrowser(
          {
            name: 'test',
            version: '0.0.0',
            browser: './browser.js',
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
        fileName: 'browser.js',
        itemPath: ['browser'],
        moduleName: undefined,
        packagePath: './package.json',
        packageDirectory: resolve('/tmp'),
        relativePath: 'browser.js',
        resolvedPath: resolve('/tmp/browser.js'),
        subpath: undefined,
        type: 'module',
      },
    ] satisfies EntryPoint[]);

    expect(
      Array.from(
        getEntryPointsFromBrowser(
          {
            name: 'test',
            version: '0.0.0',
            browser: {
              example: false,
              file: './browser.js',
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
        fileName: 'browser.js',
        itemPath: ['browser', 'file'],
        moduleName: undefined,
        packagePath: './package.json',
        packageDirectory: resolve('/tmp'),
        relativePath: 'browser.js',
        resolvedPath: resolve('/tmp/browser.js'),
        subpath: undefined,
        type: 'module',
      },
    ] satisfies EntryPoint[]);
  });
});
