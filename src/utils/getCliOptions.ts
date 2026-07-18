import { parseArgs, type ParseArgsConfig } from 'node:util';

import { deepFreeze } from '@webdeveric/utils/deepFreeze';
import { is } from '@webdeveric/utils/predicate/factory/is';

import { cliArgsConfig } from '@src/arguments.js';
import type { CliOptions } from '@src/types.js';

import { parseConcurrency } from './parseConcurrency.js';

/**
 * Process the raw CLI arguments (`argv`) into a readonly `CliOptions` object.
 *
 * @example
 * ```ts
 * const options = getCliOptions(process.argv);
 * ```
 */
export function getCliOptions(args?: NodeJS.Process['argv'], pipingIn = false): Readonly<CliOptions> {
  const config = {
    // Allow passing in `args` for testing.
    args,
    ...cliArgsConfig,
  } satisfies ParseArgsConfig;

  const { values, positionals } = parseArgs(config);

  const noBail = values['no-bail'] ?? config.options['no-bail'].default;
  const noInfo = values['no-info'] ?? config.options['no-info'].default;
  const devCondition = values['dev-condition'] ?? config.options['dev-condition'].default;

  const isReporter = is('text', 'ndjson', 'json', 'sarif');

  return deepFreeze({
    bail: noBail ? false : (values.bail ?? config.options.bail.default),
    check: values.check ?? config.options.check.default,
    concurrency: parseConcurrency(values.concurrency),
    reporter: isReporter(values.reporter) ? values.reporter : 'text',
    devCondition: devCondition.flatMap((item) =>
      item.split(',').map((singleDevCondition) => singleDevCondition.trim()),
    ),
    info: noInfo ? false : (values.info ?? config.options.info.default),
    verbose: values.verbose ?? config.options.verbose.default,
    help: values.help ?? config.options.help.default,
    version: values.version ?? config.options.version.default,
    packages: pipingIn ? [] : positionals.length ? positionals : ['./package.json'],
  });
}
