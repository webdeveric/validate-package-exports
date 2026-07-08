#!/usr/bin/env -S node --experimental-json-modules --no-warnings
import { parseArgs } from 'node:util';

import { comment } from '@webdeveric/utils/comment';
import { analyzeMetafile, build, context } from 'esbuild';
import { clean } from 'esbuild-plugin-clean';
import { environmentPlugin } from 'esbuild-plugin-environment';

import pkg from './package.json' with { type: 'json' };

const runnerDebug = process.env['RUNNER_DEBUG'] === '1';

const args = parseArgs({
  options: {
    debug: {
      type: 'boolean',
      short: 'd',
      default: runnerDebug,
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      default: runnerDebug,
    },
    watch: {
      type: 'boolean',
      short: 'w',
      default: false,
    },
  },
});

/** @satisfies {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['./src/cli.ts'],
  outdir: './dist',
  platform: 'node',
  bundle: true,
  format: 'esm',
  splitting: true,
  outExtension: {
    '.js': '.mjs',
  },
  metafile: args.values.verbose,
  packages: 'external',
  target: `node${process.versions.node}`,
  // Don't minify when watching, because it makes debugging harder.
  minify: args.values.watch === true ? false : process.env['NODE_ENV'] === 'production',
  legalComments: 'external',
  banner: {
    js: comment(
      `
      ${pkg.name}

      @license ${pkg.license}
      @copyright Copyright (c) ${new Date().getFullYear()} ${pkg.author.name}
      @see {@link ${pkg.homepage}}

      SPDX-License-Identifier: ${pkg.license}
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
    environmentPlugin(['npm_package_name', 'npm_package_version']),
    environmentPlugin({
      homepage: pkg.homepage,
    }),
  ],
};

if (args.values.debug) {
  console.group('Build options');
  console.dir(options);
  console.groupEnd();
}

if (args.values.watch) {
  const ctx = await context(options);

  process.on('SIGINT', () => {
    ctx.dispose().then(() => {
      console.log('\nWatching stopped.');
      process.exit(0);
    }, console.error);
  });

  await ctx.watch();

  console.log(`Watching ${options.entryPoints.join(', ')} for changes...`);
} else {
  try {
    const result = await build(options);

    if (result.metafile) {
      console.log(
        await analyzeMetafile(result.metafile, {
          verbose: args.values.debug,
        }),
      );
    }

    const errors = [...result.warnings, ...result.errors];

    if (errors.length) {
      throw new AggregateError(errors, 'Build error and warnings');
    }
  } catch (error) {
    console.error(error);

    process.exitCode ||= 1;
  }
}
