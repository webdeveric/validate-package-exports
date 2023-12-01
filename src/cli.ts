#!/usr/bin/env node

// node -e 'import * as utils from "@webdeveric/utils"; console.log(utils)' --input-type=module

import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { CliError } from '@lib/CliError.js';
import { ExitCodes } from '@src/types.js';

import { ValidatePackageExports } from './ValidatePackageExports.js';

try {
  if (typeof parseArgs === 'function') {
    const args = parseArgs({
      allowPositionals: true,
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

    const check = new ValidatePackageExports(args.values);

    await check.run();
  } else {
    console.warn('parseArgs is not a function. Please use Node JS >= 16.17');
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = error instanceof CliError ? error.code : ExitCodes.DoingItWrong;
}
