import { setMaxListeners } from 'node:events';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

import { ExitCode, ResultCode, type EntryPoint, type Result, type ValidatePackageExportsOptions } from '@src/types.js';
import { checkFileExists } from '@utils/checkFileExists.js';
import { checkSyntax } from '@utils/checkSyntax.js';
import { getEntryPoints } from '@utils/getEntryPoints.js';
import { importPackageJson } from '@utils/importPackageJson.js';
import { verifyEntryPoint } from '@utils/verifyEntryPoint.js';

import type { Logger } from './Logger.js';

export class Validator {
  options: ValidatePackageExportsOptions;

  packageDirectory: string;

  #exitCode: ExitCode;

  #controller: AbortController;

  protected readonly logger: Logger;

  constructor(options: ValidatePackageExportsOptions, logger: Logger) {
    this.options = options;

    this.packageDirectory = dirname(this.options.package);

    this.logger = logger;

    this.#exitCode = ExitCode.Ok;

    this.#controller = new AbortController();

    setMaxListeners(100, this.#controller.signal);
  }

  protected processResult(result: Result): void {
    if (result.code === ResultCode.Error) {
      this.#exitCode = ExitCode.Error;

      if (this.options.bail) {
        this.#controller.abort();
      }
    }

    const emoji = result.code === ResultCode.Success ? '✅' : result.code === ResultCode.Error ? '❌' : '😐';

    if (result.code === ResultCode.Error) {
      this.logger.error(`${emoji} ${result.name}: ${result.message} (${JSON.stringify(result.entryPoint.itemPath)})`);
      this.logger.error(result.error);
    } else {
      this.logger.info(`${emoji} ${result.name}: ${result.message}`);
    }
  }

  protected processResults(results: Result | Result[]): void {
    [results].flat().forEach(result => this.processResult(result));
  }

  async run(): Promise<ExitCode> {
    const packageJson = await importPackageJson(this.options.package);

    this.logger.debug(`📂 package directory: ${this.packageDirectory}`);

    this.logger.debug({
      options: this.options,
      packageJson,
    });

    const entryPoints: EntryPoint[] = await Readable.from(getEntryPoints(packageJson, this.packageDirectory), {
      objectMode: true,
    }).toArray({
      signal: this.#controller.signal,
    });

    // Always check to see if the file exists.
    await Readable.from(entryPoints).forEach(
      async (entryPoint: EntryPoint) => {
        const results = await checkFileExists(entryPoint);

        this.processResults(results);
      },
      {
        signal: this.#controller.signal,
        concurrency: this.options.concurrency,
      },
    );

    // Optionally run a syntax check.
    if (this.options.check) {
      const jsEntryPoints = entryPoints.filter(entryPoint => /\.[cm]?js$/i.test(entryPoint.resolvedPath));

      await Readable.from(jsEntryPoints).forEach(
        async (entryPoint: EntryPoint) => {
          const results = await checkSyntax(entryPoint, { signal: this.#controller.signal });

          this.processResults(results);
        },
        {
          signal: this.#controller.signal,
          concurrency: this.options.concurrency,
        },
      );
    }

    // Optionally try to `import`/`require` the module.
    if (this.options.verify) {
      await Readable.from(entryPoints).forEach(
        async (entryPoint: EntryPoint) => {
          const results = await verifyEntryPoint(entryPoint, {
            cwd: this.packageDirectory,
            signal: this.#controller.signal,
          });

          this.processResults(results);
        },
        {
          signal: this.#controller.signal,
          concurrency: this.options.concurrency,
        },
      );
    }

    return this.#exitCode;
  }
}
