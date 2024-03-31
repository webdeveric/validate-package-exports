import { join } from 'node:path';
import { Readable } from 'node:stream';
import { parseArgs, type ParseArgsConfig } from 'node:util';

import type { CliArguments } from '@src/types.js';

import { parseConcurrency } from './parseConcurrency.js';
import { resolvePackageJson } from './resolvePackageJson.js';

export async function getCliArguments(): Promise<CliArguments> {
  const config = {
    allowPositionals: true,
    strict: true,
    tokens: false,
    options: {
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
      // Output JSON
      json: {
        type: 'boolean',
        default: false,
        short: 'j',
      },
      // Show info messages
      info: {
        type: 'boolean',
        default: process.env.RUNNER_DEBUG === '1',
        short: 'i',
      },
      // Turn off `bail`
      'no-bail': {
        type: 'boolean',
        default: false,
      },
      // Turn off `info`
      'no-info': {
        type: 'boolean',
        default: false,
      },
    },
  } satisfies ParseArgsConfig;

  const { values, positionals } = parseArgs(config);

  const packages = await Readable.from(positionals.length ? positionals : [join(process.cwd(), 'package.json')])
    .map(packagePath => resolvePackageJson(packagePath))
    .toArray();

  const noBail = values['no-bail'] ?? config.options['no-bail'].default;
  const noInfo = values['no-info'] ?? config.options['no-info'].default;

  return {
    packages,
    concurrency: parseConcurrency(values.concurrency),
    bail: noBail ? false : values.bail ?? config.options.bail.default,
    check: values.check ?? config.options.check.default,
    verify: values.verify ?? config.options.verify.default,
    json: values.json ?? config.options.verify.default,
    info: noInfo ? false : values.info ?? config.options.info.default,
  };
}
