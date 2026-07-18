import { availableParallelism } from 'node:os';

import type { ParseArgsConfigWithDescription } from '@src/types.js';

export const cliArgsConfig = Object.freeze({
  allowPositionals: true,
  strict: true,
  tokens: false,
  options: {
    concurrency: {
      type: 'string',
      short: 'c',
      default: availableParallelism().toString(),
      description: `How many tasks to do at the same time (default: ${availableParallelism()})`,
    },
    'dev-condition': {
      type: 'string',
      multiple: true,
      default: [],
      description: 'Specify which custom conditions are used only during development',
    },
    bail: {
      type: 'boolean',
      short: 'b',
      default: process.env['CI'] === 'true',
      description: 'Stop processing at the first error.\nEnabled by default when CI=true',
    },
    'no-bail': {
      type: 'boolean',
      default: false,
      description: 'Turn off --bail',
    },
    check: {
      type: 'boolean',
      default: false,
      short: 's',
      description: 'Check syntax of JS files',
    },
    reporter: {
      type: 'string',
      default: 'text',
      description: 'text',
    },
    verbose: {
      type: 'boolean',
      default: false,
      description: 'Use verbose output',
    },
    info: {
      type: 'boolean',
      default: process.env['RUNNER_DEBUG'] === '1',
      short: 'i',
      description: 'Show info messages.\nEnabled by default when RUNNER_DEBUG=1',
    },
    'no-info': {
      type: 'boolean',
      default: false,
      description: 'Turn off --info',
    },
    version: {
      type: 'boolean',
      default: false,
      short: 'v',
      description: 'Print the version number',
    },
    help: {
      type: 'boolean',
      default: false,
      short: 'h',
      description: 'Show this help screen',
    },
  },
} satisfies ParseArgsConfigWithDescription);
