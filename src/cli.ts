#!/usr/bin/env -S node --experimental-import-meta-resolve

import { Console } from 'node:console';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { CliError } from '@lib/CliError.js';
import { ExitCodes } from '@src/types.js';

import { Validator } from './Validator.js';

try {
  if (typeof parseArgs === 'function') {
    const args = parseArgs({
      allowPositionals: true,
      strict: true,
      options: {
        package: {
          type: 'string',
          short: 'p',
          default: join(process.cwd(), 'package.json'),
        },
        info: {
          type: 'boolean',
          short: 'i',
          default: false,
        },
        debug: {
          type: 'boolean',
          short: 'd',
          default: process.env.RUNNER_DEBUG === '1',
        },
      },
    });

    await new Validator(
      args.values,
      new Console({
        stdout: process.stdout,
        stderr: process.stderr,
        inspectOptions: {
          depth: null,
        },
      }),
    ).run();
  } else {
    console.warn('parseArgs is not a function. Please use Node JS >= 16.17');
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = error instanceof CliError ? error.code : ExitCodes.NotOk;
}
