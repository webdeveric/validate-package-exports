import { describe, expect, it } from 'vitest';

import type { EntryPoint, PackageJson } from '@src/types.js';

import { ExportsProcessor } from './ExportsProcessor.js';

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
          relativePath: 'index.js',
          resolvedPath: '/tmp/index.js',
          fileName: 'index.js',
          directory: '/tmp',
          subpath: '.',
          itemPath: ['exports', '.', 0, 'default'],
        },
        {
          type: demoPackageJson.type,
          moduleName: demoPackageJson.name,
          relativePath: 'index.js',
          resolvedPath: '/tmp/index.js',
          fileName: 'index.js',
          directory: '/tmp',
          subpath: '.',
          condition: undefined,
          itemPath: ['exports', '.', 1],
        },
        {
          type: demoPackageJson.type,
          moduleName: `${demoPackageJson.name}/package.json`,
          relativePath: 'package.json',
          resolvedPath: '/tmp/package.json',
          fileName: 'package.json',
          directory: '/tmp',
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
          relativePath: 'dist/types/index.d.ts',
          resolvedPath: '/tmp/dist/types/index.d.ts',
          fileName: 'index.d.ts',
          directory: '/tmp/dist/types',
          subpath: '.',
          itemPath: ['exports', '.', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: demoPackageJson.name,
          relativePath: 'dist/cjs/index.js',
          resolvedPath: '/tmp/dist/cjs/index.js',
          fileName: 'index.js',
          directory: '/tmp/dist/cjs',
          subpath: '.',
          itemPath: ['exports', '.', 'require'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: demoPackageJson.name,
          relativePath: 'dist/mjs/index.js',
          resolvedPath: '/tmp/dist/mjs/index.js',
          fileName: 'index.js',
          directory: '/tmp/dist/mjs',
          subpath: '.',
          itemPath: ['exports', '.', 'import'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: 'dist/types/*.d.ts',
          resolvedPath: '/tmp/dist/types/*.d.ts',
          fileName: '*.d.ts',
          directory: '/tmp/dist/types',
          subpath: './*',
          itemPath: ['exports', './*', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: 'dist/cjs/*.js',
          resolvedPath: '/tmp/dist/cjs/*.js',
          fileName: '*.js',
          directory: '/tmp/dist/cjs',
          subpath: './*',
          itemPath: ['exports', './*', 'require'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: `${demoPackageJson.name}/*`,
          relativePath: 'dist/mjs/*.js',
          resolvedPath: '/tmp/dist/mjs/*.js',
          fileName: '*.js',
          directory: '/tmp/dist/mjs',
          subpath: './*',
          itemPath: ['exports', './*', 'import'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: 'dist/types/sub-folder/*.d.ts',
          resolvedPath: '/tmp/dist/types/sub-folder/*.d.ts',
          fileName: '*.d.ts',
          directory: '/tmp/dist/types/sub-folder',
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'require', 'types'],
        },
        {
          type: 'commonjs',
          condition: 'require',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: 'dist/cjs/sub-folder/*.js',
          resolvedPath: '/tmp/dist/cjs/sub-folder/*.js',
          fileName: '*.js',
          directory: '/tmp/dist/cjs/sub-folder',
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'require', 'default'],
        },
        {
          type: 'commonjs',
          condition: 'types',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: 'dist/types/sub-folder/*.d.ts',
          resolvedPath: '/tmp/dist/types/sub-folder/*.d.ts',
          fileName: '*.d.ts',
          directory: '/tmp/dist/types/sub-folder',
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'import', 'types'],
        },
        {
          type: 'module',
          condition: 'import',
          moduleName: `${demoPackageJson.name}/sub-folder/*`,
          relativePath: 'dist/mjs/sub-folder/*.js',
          resolvedPath: '/tmp/dist/mjs/sub-folder/*.js',
          fileName: '*.js',
          directory: '/tmp/dist/mjs/sub-folder',
          subpath: './sub-folder/*',
          itemPath: ['exports', './sub-folder/*', 'import', 'default'],
        },
        {
          type: 'commonjs',
          condition: undefined,
          moduleName: `${demoPackageJson.name}/package.json`,
          relativePath: 'package.json',
          resolvedPath: '/tmp/package.json',
          fileName: 'package.json',
          directory: '/tmp',
          subpath: './package.json',
          itemPath: ['exports', './package.json'],
        },
      ]);
    });
  });
});
