import assert from 'node:assert';
import { availableParallelism } from 'node:os';
import { dirname, resolve } from 'node:path';

import type { MaybeUndefined, ValidatePackageExportsOptions } from '@src/types.js';
import { importPackageJson } from '@src/utils.js';

import type { Logger } from './Logger.js';

export class Validator {
  options: ValidatePackageExportsOptions;

  packageDirectory: string;

  protected readonly logger: Logger;

  constructor(options: MaybeUndefined<ValidatePackageExportsOptions> = {}, logger: Logger) {
    assert(options.package, 'package not specified');

    this.options = {
      package: resolve(options.package),
      bail: options.bail ?? false,
      concurrency: options.concurrency ?? availableParallelism(),
      info: options.info ?? false,
      debug: options.debug ?? false,
    };

    this.packageDirectory = dirname(this.options.package);

    this.logger = logger;
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

    this.logger.info(`packageDirectory: ${this.packageDirectory}`);

    if (this.options.debug) {
      this.logger.dir({
        options: this.options,
        npmEnvVars: this.npmEnvVars,
        packageJson,
      });
    }

    const tasks = new Set();

    // async function* getResults(): AsyncGenerator<TaskResult> {
    //   yield 1;
    //   yield 2;
    // }

    if (packageJson.bin) {
      tasks.add(() => {
        this.logger.log(packageJson.bin);
      });
    }

    // const queue = new TaskQueue({
    //   context: {
    //     packageJson,
    //     packageDirectory: this.packageDirectory,

    //   },
    // });

    // queue.add(new ValidateBinTask());
    // // queue.add(new ImportModuleTask());

    // const taskResults = await queue.run();

    // this.info({ taskResults });
  }
}
