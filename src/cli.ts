#!/usr/bin/env -S node --experimental-import-meta-resolve

import { Console } from 'node:console';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { CliError } from '@lib/CliError.js';
import { ExitCodes } from '@src/types.js';

import { parseConcurrency } from './utils/parseConcurrency.js';
import { Validator } from './Validator.js';

const logger = new Console({
  stdout: process.stdout,
  stderr: process.stderr,
  inspectOptions: {
    depth: null,
  },
});

try {
  const args = parseArgs({
    allowPositionals: false,
    strict: true,
    options: {
      package: {
        type: 'string',
        short: 'p',
        default: join(process.cwd(), 'package.json'),
      },
      bail: {
        type: 'boolean',
        short: 'b',
        // Fail quickly if running in a CI service.
        default: process.env.CI === 'true',
      },
      concurrency: {
        type: 'string',
        short: 'c',
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
    {
      package: String(args.values.package),
      concurrency: parseConcurrency(args.values.concurrency),
      bail: Boolean(args.values.bail),
      info: Boolean(args.values.info),
      debug: Boolean(args.values.debug),
    },
    logger,
  ).run();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }

  process.exitCode = error instanceof CliError ? error.code : ExitCodes.NotOk;
}
