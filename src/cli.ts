#!/usr/bin/env node

import assert from 'node:assert';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { Logger } from '@lib/Logger.js';
import { Validator } from '@lib/Validator.js';
import { ExitCode, type LogLevelName } from '@src/types.js';
import { parseConcurrency } from '@utils/parseConcurrency.js';

try {
  const { values } = parseArgs({
    allowPositionals: false,
    strict: true,
    tokens: true,
    options: {
      package: {
        type: 'string',
        short: 'p',
        default: join(process.cwd(), 'package.json'),
      },
      concurrency: {
        type: 'string',
        short: 'c',
      },
      // Stop processing at the first error.
      bail: {
        type: 'boolean',
        short: 'b',
        // Fail quickly if running in a CI service.
        default: process.env.CI === 'true',
      },
      // Run syntax check
      check: {
        type: 'boolean',
        default: false,
        short: 's',
      },
      // Attempt to `import()` or `require()` the module.
      verify: {
        type: 'boolean',
        default: false,
        short: 'v',
      },
      logLevel: {
        type: 'string',
        short: 'l',
        default: (process.env.RUNNER_DEBUG === '1' ? 'debug' : 'info') satisfies LogLevelName,
      },
    },
  });

  assert(values.package, 'Package not defined');

  process.exitCode = await new Validator(
    {
      package: resolve(values.package),
      concurrency: parseConcurrency(values.concurrency),
      bail: Boolean(values.bail),
      check: Boolean(values.check),
      verify: Boolean(values.verify),
    },
    new Logger(
      {
        stdout: process.stdout,
        stderr: process.stderr,
        inspectOptions: {
          depth: null,
        },
      },
      values.logLevel,
    ),
  ).run();
} catch (error) {
  console.dir(error, { depth: null });

  process.exitCode ??= ExitCode.Error;
}
