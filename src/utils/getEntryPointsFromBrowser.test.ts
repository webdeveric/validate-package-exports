import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { createPackageContext } from './createPackageContext.js';
import { getEntryPointsFromBrowser } from './getEntryPointsFromBrowser.js';

describe('getEntryPointsFromBrowser()', () => {
  const mockPackageJson = {
    name: 'mock-package',
    type: 'module',
    version: '0.0.0',
    exports: {
      './path.js': './path.js',
    },
  } satisfies PackageJson;

  const packageContext = createPackageContext({
    resolvedPath: resolve('/tmp/package.json'),
    realPath: resolve('/tmp/package.json'),
    packageJson: mockPackageJson,
    rawPackageJson: JSON.stringify(mockPackageJson),
  });

  it('yields EntryPoint objects', () => {
    expect(
      Array.from(
        getEntryPointsFromBrowser(
          {
            ...mockPackageJson,

            browser: './browser.js',
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'browser.js',
        itemPath: ['browser'],
        moduleName: undefined,
        relativePath: 'browser.js',
        resolvedPath: resolve('/tmp/browser.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      },
    ] satisfies EntryPoint[]);

    expect(
      Array.from(
        getEntryPointsFromBrowser(
          {
            ...mockPackageJson,
            browser: {
              example: false,
              file: './browser.js',
            },
          },
          packageContext,
        ),
      ),
    ).toEqual([
      {
        condition: [],
        directory: resolve('/tmp'),
        fileName: 'browser.js',
        itemPath: ['browser', 'file'],
        moduleName: undefined,
        relativePath: 'browser.js',
        resolvedPath: resolve('/tmp/browser.js'),
        subpath: undefined,
        type: 'module',
        packageContext,
      },
    ] satisfies EntryPoint[]);
  });
});
