import { EventEmitter } from 'node:events';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

import { ExitCode, type EntryPoint, type PackageContext, type PackageJson, type ValidatorOptions } from '@src/types.js';
import { checkFileExists } from '@utils/checkFileExists.js';
import { checkSyntax } from '@utils/checkSyntax.js';
import { getEntryPoints } from '@utils/getEntryPoints.js';
import { getPacklist } from '@utils/getPacklist.js';
import { importPackageJson } from '@utils/importPackageJson.js';
import { isSubpathExports } from '@utils/type-predicate.js';
import { verifyEntryPoint } from '@utils/verifyEntryPoint.js';

import { ResultCode, Result } from './Result.js';

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
    [results].flat().forEach((result) => this.processResult(result));
  }

  protected checkPackageJson(packageJson: PackageJson, packageContext: PackageContext): Result {
    const entryPoint: EntryPoint = {
      moduleName: `${packageContext.name}/package.json`,
      packageDirectory: packageContext.directory,
      packagePath: packageContext.path,
      type: packageContext.type,
      fileName: 'package.json',
      resolvedPath: packageContext.path,
      relativePath: 'package.json',
      subpath: undefined,
      condition: undefined,
      directory: packageContext.directory,
      itemPath: [],
    };

    const result = new Result(
      isSubpathExports(packageJson.exports) && !Reflect.has(packageJson.exports, '.')
        ? {
            name: 'package-json',
            code: ResultCode.Error,
            message: 'package.json exports is missing "." property.',
            entryPoint,
            error: new Error('"." is missing from exports.'),
          }
        : {
            name: 'package-json',
            code: ResultCode.Success,
            message: 'package.json exports has required property.',
            entryPoint,
          },
    );

    this.processResult(result);

    return result;
  }

  protected async checkFilesExist(entryPoints: EntryPoint[]): Promise<Result[]> {
    return await Readable.from(entryPoints)
      .map(
        async (entryPoint: EntryPoint) => {
          const results = await checkFileExists(entryPoint);

          this.processResults(results);

          return results;
        },
        {
          signal: this.#controller.signal,
          concurrency: this.options.concurrency,
        },
      )
      .toArray({
        signal: this.#controller.signal,
      });
  }

  protected async checkSyntax(entryPoints: EntryPoint[]): Promise<Result[]> {
    const jsEntryPoints = entryPoints.filter((entryPoint) => /\.[cm]?js$/i.test(entryPoint.resolvedPath));

    return await Readable.from(jsEntryPoints)
      .map(
        async (entryPoint: EntryPoint) => {
          const results = await checkSyntax(entryPoint, { signal: this.#controller.signal });

          this.processResults(results);

          return results;
        },
        {
          signal: this.#controller.signal,
          concurrency: this.options.concurrency,
        },
      )
      .toArray({
        signal: this.#controller.signal,
      });
  }

  protected async verifyIncludes(entryPoints: EntryPoint[]): Promise<Result[]> {
    return (
      await Readable.from(entryPoints)
        .map(
          (entryPoint: EntryPoint) => {
            const results = verifyEntryPoint(entryPoint);

            this.processResults(results);

            return results;
          },
          {
            signal: this.#controller.signal,
            concurrency: this.options.concurrency,
          },
        )
        .toArray({
          signal: this.#controller.signal,
        })
    ).flat();
  }

  protected async checkPacklist(entryPoints: EntryPoint[], packageContext: PackageContext): Promise<Result[]> {
    const files = new Set(await getPacklist(packageContext.directory));

    const results = entryPoints.map((entryPoint): Result => {
      const willBePacked = files.has(entryPoint.relativePath);

      return new Result({
        name: 'packlist',
        code: willBePacked ? ResultCode.Success : ResultCode.Error,
        message: willBePacked
          ? `${entryPoint.relativePath} will be packed.`
          : `${entryPoint.relativePath} will not be packed.`,
        error: willBePacked ? undefined : new Error('EntryPoint relativePath not found in packlist files.'),
        entryPoint,
      });
    });

    this.processResults(results);

    return results;
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

    const entryPointsWithErrors = new Set<EntryPoint>();

    const recordErrors = (results: Result[]): void => {
      results.forEach((result) => {
        if (result.code === ResultCode.Error) {
          entryPointsWithErrors.add(result.entryPoint);
        }
      });
    };

    const getNextEntryPoints = (items: EntryPoint[]): EntryPoint[] => {
      return items.filter((entryPoint) => !entryPointsWithErrors.has(entryPoint));
    };

    // Check the structure of the `package.json` data.
    recordErrors([this.checkPackageJson(packageJson, packageContext)]);

    // Always check to see if the file exists.
    recordErrors(await this.checkFilesExist(entryPoints));

    // Optionally run a syntax check.
    if (this.options.check) {
      recordErrors(await this.checkSyntax(getNextEntryPoints(entryPoints)));
    }

    recordErrors(await this.verifyIncludes(getNextEntryPoints(entryPoints)));

    recordErrors(await this.checkPacklist(getNextEntryPoints(entryPoints), packageContext));

    // TODO: maybe do some reporting using `entryPointsWithErrors`

    return this.#exitCode;
  }
}
