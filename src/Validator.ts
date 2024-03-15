import assert from 'node:assert';
import { availableParallelism } from 'node:os';
import { dirname, resolve } from 'node:path';

import { LogLevel, type MaybeUndefined, type ValidatePackageExportsOptions } from '@src/types.js';
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
    };

    this.packageDirectory = dirname(this.options.package);

    this.logger = logger;
  }

  async run(): Promise<void> {
    const packageJson = await importPackageJson(this.options.package);

    this.logger.info(`packageDirectory: ${this.packageDirectory}`);

    if (this.logger.willLog(LogLevel.Debug)) {
      const { getNpmEnvVars } = await import('./utils/getNpmEnvVars.js');

      this.logger.debug({
        options: this.options,
        npmEnvVars: getNpmEnvVars(),
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
