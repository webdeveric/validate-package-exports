import { parseArgs, styleText, type ParseArgsConfig } from 'node:util';

import type { CliArguments } from '@src/types.js';

import { parseConcurrency } from './parseConcurrency.js';

export function getCliArguments(args?: NodeJS.Process['argv']): CliArguments {
  const config = {
    // Allow passing in `args` for testing.
    args,
    allowPositionals: true,
    strict: true,
    tokens: false,
    options: {
      // This value is used in `Readable` options.
      concurrency: {
        type: 'string',
        short: 'c',
      },
      // Specify which custom conditions are used only during development.
      'dev-condition': {
        type: 'string',
        multiple: true,
        default: [],
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
      /**
       * @deprecated This is done automatically and this flag will be removed in the next major version.
       */
      verify: {
        type: 'boolean',
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

  if ('verify' in values && !values.json) {
    console.warn(
      styleText(
        ['bold', 'whiteBright', 'bgBlack'],
        'The --verify flag is deprecated and will be removed in the next version.',
      ),
    );
  }

  const noBail = values['no-bail'] ?? config.options['no-bail'].default;
  const noInfo = values['no-info'] ?? config.options['no-info'].default;
  const devCondition = values['dev-condition'] ?? config.options['dev-condition'].default;

  return {
    bail: noBail ? false : (values.bail ?? config.options.bail.default),
    check: values.check ?? config.options.check.default,
    concurrency: parseConcurrency(values.concurrency),
    devCondition: devCondition.flatMap((item) => {
      return item.split(',').map((singleDevCondition) => singleDevCondition.trim());
    }),
    info: noInfo ? false : (values.info ?? config.options.info.default),
    json: values.json ?? false,
    packages: positionals.length ? positionals : ['./package.json'],
  };
}
