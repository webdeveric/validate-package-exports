import { resolve, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { ExportsProcessor } from './ExportsProcessor.js';

function fixSlash(input: string): string {
  return input.replaceAll('/', sep);
}

describe('ExportsProcessor', () => {
  describe('Gets EntryPoint[] from package.json exports', () => {
    it('Works with ExportsEntryPath', () => {
      const demoPackageJson = {
        name: 'demo',
        type: 'commonjs',
        version: '123.456.789',
        exports: null,
      } satisfies PackageJson;

      expect(
        new ExportsProcessor().process(demoPackageJson.exports, {
          packageName: demoPackageJson.name,
          packageType: demoPackageJson.type,
          packageDirectory: '/tmp',
          itemPath: ['exports'],
        }),
      ).toHaveLength(0);
    });

    it('Works with SubpathExports', () => {
      const demoPackageJson = {
        name: 'demo',
        type: 'commonjs',
        version: '123.456.789',
        exports: {
          '.': [
            {
              default: './index.js',
            },
            './index.js',
          ],
          './package.json': './package.json',
        },
      } satisfies PackageJson;

      const entryPoints = new ExportsProcessor().process(demoPackageJson.exports, {
        packageName: demoPackageJson.name,
        packageType: demoPackageJson.type,
        packageDirectory: '/tmp',
        itemPath: ['exports'],
      });

      expect(entryPoints).toEqual([
        {
          condition: 'default',
          type: demoPackageJson.type,
          moduleName: demoPackageJson.name,
          relativePath: fixSlash('index.js'),
          resolvedPath: resolve('/tmp/index.js'),
          fileName: 'index.js',
          directory: resolve('/tmp'),
          subpath: '.',
          itemPath: ['exports', '.', 0, 'default'],
        },
        {
          type: demoPackageJson.type,
          moduleName: demoPackageJson.name,
          relativePath: fixSlash('index.js'),
          resolvedPath: resolve('/tmp/index.js'),
          fileName: 'index.js',
          directory: resolve('/tmp'),
          subpath: '.',
          condition: undefined,
          itemPath: ['exports', '.', 1],
        },
        {
          type: demoPackageJson.type,
          moduleName: `${demoPackageJson.name}/package.json`,
          relativePath: fixSlash('package.json'),
          resolvedPath: resolve('/tmp/package.json'),
          fileName: 'package.json',
          directory: resolve('/tmp'),
          subpath: './package.json',
          condition: undefined,
          itemPath: ['exports', './package.json'],
        },
      ] satisfies EntryPoint[]);
    });

    it('Works with ConditionalExports', () => {
      const demoPackageJson = {
        name: 'demo',
        type: 'commonjs',
        version: '123.456.789',
        exports: {
          '.': {
            types: './dist/types/index.d.ts',
            require: './dist/cjs/index.js',
            import: './dist/mjs/index.js',
          },
          './*': {
            types: './dist/types/*.d.ts',
            require: './dist/cjs/*.js',
            import: './dist/mjs/*.js',
          },
          './sub-folder/*': {
            require: {
              types: './dist/types/sub-folder/*.d.ts',
              default: './dist/cjs/sub-folder/*.js',
            },
            import: {
              types: './dist/types/sub-folder/*.d.ts',
              default: './dist/mjs/sub-folder/*.js',
            },
          },
          './package.json': './package.json',
        },
      } satisfies PackageJson;

      const entryPoints = new ExportsProcessor().process(demoPackageJson.exports, {
        packageName: demoPackageJson.name,
        packageType: demoPackageJson.type,
        packageDirectory: '/tmp',
        itemPath: ['exports'],
      });

      expect(entryPoints).toEqual([
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: demoPackageJson.name,
          relativePath: fixSlash('dist/types/index.d.ts'),
          resolvedPath: resolve('/tmp/dist/types/index.d.ts'),
          fileName: 'index.d.ts',
          directory: resolve('/tmp/dist/types'),
          subpath: '.',
          itemPath: ['exports', '.', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: demoPackageJson.name,
          relativePath: fixSlash('dist/cjs/index.js'),
          resolvedPath: resolve('/tmp/dist/cjs/index.js'),
          fileName: 'index.js',
          directory: resolve('/tmp/dist/cjs'),
          subpath: '.',
          itemPath: ['exports', '.', 'require'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: demoPackageJson.name,
          relativePath: fixSlash('dist/mjs/index.js'),
          resolvedPath: resolve('/tmp/dist/mjs/index.js'),
          fileName: 'index.js',
          directory: resolve('/tmp/dist/mjs'),
          subpath: '.',
          itemPath: ['exports', '.', 'import'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: fixSlash('dist/types/*.d.ts'),
          resolvedPath: resolve('/tmp/dist/types/*.d.ts'),
          fileName: '*.d.ts',
          directory: resolve('/tmp/dist/types'),
          subpath: './*',
          itemPath: ['exports', './*', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: fixSlash('dist/cjs/*.js'),
          resolvedPath: resolve('/tmp/dist/cjs/*.js'),
          fileName: '*.js',
          directory: resolve('/tmp/dist/cjs'),
          subpath: './*',
          itemPath: ['exports', './*', 'require'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: fixSlash('dist/mjs/*.js'),
          resolvedPath: resolve('/tmp/dist/mjs/*.js'),
          fileName: '*.js',
          directory: resolve('/tmp/dist/mjs'),
          subpath: './*',
          itemPath: ['exports', './*', 'import'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: fixSlash('dist/types/sub-folder/*.d.ts'),
          resolvedPath: resolve('/tmp/dist/types/sub-folder/*.d.ts'),
          fileName: '*.d.ts',
          directory: resolve('/tmp/dist/types/sub-folder'),
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'require', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: fixSlash('dist/cjs/sub-folder/*.js'),
          resolvedPath: resolve('/tmp/dist/cjs/sub-folder/*.js'),
          fileName: '*.js',
          directory: resolve('/tmp/dist/cjs/sub-folder'),
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'require', 'default'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: fixSlash('dist/types/sub-folder/*.d.ts'),
          resolvedPath: resolve('/tmp/dist/types/sub-folder/*.d.ts'),
          fileName: '*.d.ts',
          directory: resolve('/tmp/dist/types/sub-folder'),
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'import', 'types'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: fixSlash('dist/mjs/sub-folder/*.js'),
          resolvedPath: resolve('/tmp/dist/mjs/sub-folder/*.js'),
          fileName: '*.js',
          directory: resolve('/tmp/dist/mjs/sub-folder'),
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'import', 'default'],
        },
        {
          type: 'commonjs',
          condition: undefined,
          moduleName: `${demoPackageJson.name}/package.json`,
          relativePath: fixSlash('package.json'),
          resolvedPath: resolve('/tmp/package.json'),
          fileName: 'package.json',
          directory: resolve('/tmp'),
          subpath: './package.json',
          itemPath: ['exports', './package.json'],
        },
      ]);
    });
  });
});