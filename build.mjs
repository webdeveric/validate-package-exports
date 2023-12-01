#!/usr/bin/env -S node --experimental-json-modules --no-warnings

import { comment } from '@webdeveric/utils/comment';
import { build } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { environmentPlugin } from 'esbuild-plugin-environment';
import { nodeExternals } from 'esbuild-plugin-node-externals';

import pkg from './package.json' assert { type: 'json' };

try {
  const results = await build({
    entryPoints: ['./src/cli.ts'],
    outdir: './dist',
    platform: 'node',
    bundle: true,
    format: 'esm',
    outExtension: {
      '.js': '.mjs',
    },
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
      nodeExternals(),
      environmentPlugin(['npm_package_engines_node']),
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
