#!/usr/bin/env -S node --experimental-import-meta-resolve

import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { CliError } from '@lib/CliError.js';
import { ExitCodes, type LogLevelName } from '@src/types.js';

import { Logger } from './Logger.js';
import { parseConcurrency } from './utils/parseConcurrency.js';
import { Validator } from './Validator.js';

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
      logLevel: {
        type: 'string',
        short: 'l',
        default: (process.env.RUNNER_DEBUG === '1' ? 'debug' : 'warning') satisfies LogLevelName,
      },
    },
  });

  await new Validator(
    {
      package: String(args.values.package),
      concurrency: parseConcurrency(args.values.concurrency),
      bail: Boolean(args.values.bail),
    },
    new Logger(
      {
        stdout: process.stdout,
        stderr: process.stderr,
        inspectOptions: {
          depth: null,
        },
      },
      args.values.logLevel,
    ),
  ).run();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exitCode = error instanceof CliError ? error.code : ExitCodes.NotOk;
}
