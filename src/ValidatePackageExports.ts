import assert from 'node:assert';
import { Console } from 'node:console';
import { dirname, resolve } from 'node:path';

import type { MaybeUndefined, ValidatePackageExportsOptions } from '@src/types.js';
import { importPackageJson } from '@src/utils.js';
import { ImportModuleTask } from '@tasks/ImportModuleTask.js';

export class ValidatePackageExports {
  options: ValidatePackageExportsOptions;

  packageDirectory: string;

  protected readonly console: Console;

  constructor(
    options: MaybeUndefined<ValidatePackageExportsOptions> = {},
    console = new Console({ stdout: process.stdout, stderr: process.stderr }),
  ) {
    assert(options.package, 'package not specified');

    this.options = {
      package: resolve(options.package),
      info: options.info ?? false,
      debug: options.debug ?? false,
    };

    this.packageDirectory = dirname(this.options.package);

    this.console = console;
  }

  info(...args: Parameters<Console['info']>): void {
    if (this.options.info) {
      this.console.info(...args);
    }
  }

  debug(...args: Parameters<Console['debug']>): void {
    if (this.options.debug) {
      this.console.debug(...args);
    }
  }

  dir(...args: Parameters<Console['dir']>): void {
    this.console.dir(...args);
  }

  get npmEnvVars(): Record<`npm_${string}`, string> {
    return Object.fromEntries(
      Object.entries(process.env)
        .filter(
          (entry): entry is [key: `npm_${string}`, value: string] =>
            entry[0].startsWith('npm_') && typeof entry[1] === 'string',
        )
        .sort((left, right) => left[0].localeCompare(right[0])),
    );
  }

  async run(): Promise<void> {
    const packageJson = await importPackageJson(this.options.package);

    this.info(`packageDirectory: ${this.packageDirectory}`);

    this.debug({
      options: this.options,
      packageJson,
    });

    new ImportModuleTask(packageJson.name, packageJson.type ?? 'commonjs');
  }
}
