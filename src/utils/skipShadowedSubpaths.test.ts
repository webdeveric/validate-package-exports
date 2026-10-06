import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { ExportsProcessor } from '@lib/ExportsProcessor.js';
import type { EntryPoint, PackageExports, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';
import { createPackageContext } from './createPackageContext.js';
import { normalizePackageJsonPath } from './resolvePackageJson.js';
import { skipShadowedSubpaths } from './skipShadowedSubpaths.js';

describe('skipShadowedSubpaths()', () => {
  const mockPackageJson = {
    name: 'mock-package',
    type: 'module',
    version: '0.0.0',
  } satisfies PackageJson;

  const packageContext = createPackageContext({
    resolvedPath: normalizePackageJsonPath('/tmp/package.json'),
    realPath: normalizePackageJsonPath('/tmp/package.json'),
    packageJson: mockPackageJson,
    rawPackageJson: JSON.stringify(mockPackageJson),
  });

  const exports = {
    '.': './dist/index.js',
    './*': './dist/*.js',
    './internal/*': null,
    './internal/index': './dist/internal/index.js',
    './cjs-only/*': [
      {
        import: null,
      },
      './dist/cjs-only/*.cjs',
    ],
  } satisfies PackageExports;

  const processor = new ExportsProcessor();

  processor.process(exports, { itemPath: ['exports'] }, packageContext);

  function createPatternEntryPoint(moduleName: string, subpath: string, condition: string[] = []): EntryPoint {
    return createEntryPoint({
      moduleName,
      modulePath: `./dist/${moduleName.slice(packageContext.name.length + 1)}.js`,
      packageContext,
      subpath,
      itemPath: ['exports', subpath],
      condition,
    });
  }

  async function getModuleNames(entryPoints: EntryPoint[]): Promise<(string | undefined)[]> {
    const results: EntryPoint[] = await Readable.from(skipShadowedSubpaths(entryPoints, processor)).toArray();

    return results.map((entryPoint) => entryPoint.moduleName);
  }

  it('Keeps entry points that are not subpath patterns', async () => {
    const entryPoints = [
      createEntryPoint({
        modulePath: './dist/index.js',
        packageContext,
        subpath: '.',
        itemPath: ['exports', '.'],
      }),
      createEntryPoint({
        modulePath: './bin/cli.js',
        packageContext,
        subpath: undefined,
        itemPath: ['bin'],
      }),
    ];

    expect(await getModuleNames(entryPoints)).toEqual(['mock-package', undefined]);
  });

  it('Keeps entry points resolved by their own subpath pattern', async () => {
    expect(await getModuleNames([createPatternEntryPoint('mock-package/utils', './*')])).toEqual([
      'mock-package/utils',
    ]);
  });

  it('Skips entry points blocked by a more specific null subpath', async () => {
    expect(await getModuleNames([createPatternEntryPoint('mock-package/internal/utils', './*')])).toEqual([]);
  });

  it('Skips entry points that have a more specific subpath key', async () => {
    expect(await getModuleNames([createPatternEntryPoint('mock-package/internal/index', './*')])).toEqual([]);
  });

  it('Skips entry points whose own subpath key resolves to null for their condition', async () => {
    expect(
      await getModuleNames([
        createPatternEntryPoint('mock-package/cjs-only/utils', './cjs-only/*', ['import']),
        createPatternEntryPoint('mock-package/cjs-only/utils', './cjs-only/*', ['require']),
      ]),
    ).toEqual(['mock-package/cjs-only/utils']);
  });
});
