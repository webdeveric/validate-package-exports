import { EventEmitter } from 'node:events';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

import { ExitCode, type EntryPoint, type PackageContext, type ValidatorOptions } from '@src/types.js';
import { checkFileExists } from '@utils/checkFileExists.js';
import { checkSyntax } from '@utils/checkSyntax.js';
import { getEntryPoints } from '@utils/getEntryPoints.js';
import { importPackageJson } from '@utils/importPackageJson.js';
import { verifyEntryPoint } from '@utils/verifyEntryPoint.js';

import { ResultCode, type Result } from './Result.js';

export class Validator extends EventEmitter {
  options: ValidatorOptions;

  packageDirectory: string;

  #exitCode: ExitCode;

  #controller: AbortController;

  constructor(options: ValidatorOptions) {
    super();

    this.options = options;

    this.packageDirectory = dirname(this.options.package);

    this.#exitCode = ExitCode.Ok;

    this.#controller = options.controller;
  }

  protected processResult(result: Result): void {
    this.emit('result', result);

    if (result.code === ResultCode.Error) {
      this.#exitCode = ExitCode.Error;

      if (this.options.bail) {
        this.#controller.abort();
      }
    }
  }

  protected processResults(results: Result | Result[]): void {
    [results].flat().forEach(result => this.processResult(result));
  }

  protected async checkFilesExist(entryPoints: EntryPoint[]): Promise<void> {
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
  }

  protected async checkSyntax(entryPoints: EntryPoint[]): Promise<void> {
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

  protected async verifyIncludes(entryPoints: EntryPoint[]): Promise<void> {
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

  async run(): Promise<ExitCode> {
    const packageJson = await importPackageJson(this.options.package);

    const packageContext: PackageContext = {
      name: packageJson.name,
      type: packageJson.type ?? 'commonjs',
      path: this.options.package,
      directory: this.packageDirectory,
    };

    const entryPoints: EntryPoint[] = await Readable.from(getEntryPoints(packageJson, packageContext), {
      objectMode: true,
    }).toArray({
      signal: this.#controller.signal,
    });

    // Always check to see if the file exists.
    await this.checkFilesExist(entryPoints);

    // Optionally run a syntax check.
    if (this.options.check) {
      await this.checkSyntax(entryPoints);
    }

    // Optionally try to `import`/`require` the module.
    if (this.options.verify) {
      await this.verifyIncludes(entryPoints);
    }

    return this.#exitCode;
  }
}
