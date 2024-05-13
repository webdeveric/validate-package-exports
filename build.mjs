#!/usr/bin/env -S node --experimental-json-modules --no-warnings

import { comment } from '@webdeveric/utils/comment';
import { build } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { environmentPlugin } from 'esbuild-plugin-environment';

const nodeVersion = Number.parseInt(String(process.versions.node.split('.').at(0)));

const { default: pkg } = await import('./package.json', {
  [nodeVersion < 20 ? 'assert' : 'with']: { type: 'json' },
});

try {
  const results = await build({
    entryPoints: ['./src/cli.ts'],
    outdir: './dist',
    platform: 'node',
    bundle: true,
    format: 'esm',
    splitting: true,
    outExtension: {
      '.js': '.mjs',
    },
    packages: 'external',
    target: `node${process.versions.node}`,
    minify: process.env.NODE_ENV === 'production',
    banner: {
      js: comment(
        `
          @file ${pkg.name}
          @version ${pkg.version}
          @license ${pkg.license}
          @copyright ${pkg.author.name} ${new Date().getFullYear()}
          @see {@link ${pkg.homepage}}
        `,
        {
          type: 'legal',
        },
      ),
    },
    plugins: [
      clean({
        patterns: ['./dist/*'],
      }),
      environmentPlugin(['npm_package_name']),
    ],
  });

  const errors = [...results.warnings, ...results.errors];

  if (errors.length) {
    throw new AggregateError(errors, 'Build error and warnings');
  }
} catch (error) {
  console.error(error);

  process.exitCode ||= 1;
}
