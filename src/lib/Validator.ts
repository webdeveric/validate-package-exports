import { EventEmitter } from 'node:events';
import { realpath } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

import { asArray } from '@webdeveric/utils/asArray';
import { unique } from '@webdeveric/utils/unique';

import {
  ExitCode,
  type EntryPoint,
  type PackageContext,
  type PackageJson,
  type RealEntryPoint,
  type ValidatorOptions,
} from '@src/types.js';
import { checkFileExists } from '@utils/checkFileExists.js';
import { checkSyntax } from '@utils/checkSyntax.js';
import { getEntryPoints } from '@utils/getEntryPoints.js';
import { getPacklist } from '@utils/getPacklist.js';
import { getRealEntryPoint } from '@utils/getRealEntryPoint.js';
import { readPackageJson } from '@utils/readPackageJson.js';
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
    asArray(results).forEach((result) => this.processResult(result));
  }

  protected checkPackageJson(packageJson: PackageJson, packageContext: PackageContext): Result {
    const entryPoint: RealEntryPoint = {
      moduleName: `${packageContext.name}/package.json`,
      type: packageContext.type,
      fileName: 'package.json',
      resolvedPath: packageContext.path,
      realResolvedPath: packageContext.realPath,
      relativePath: 'package.json',
      subpath: undefined,
      condition: undefined,
      directory: packageContext.directory,
      realDirectory: packageContext.realDirectory,
      itemPath: [],
      packageContext,
    };

    const result = new Result(
      isSubpathExports(packageJson.exports) && !Reflect.has(packageJson.exports, '.')
        ? {
            name: 'package-json',
            code: ResultCode.Error,
            message: 'package.json exports is missing "." property.',
            realEntryPoint: entryPoint,
            error: new Error('"." is missing from exports.'),
          }
        : {
            name: 'package-json',
            code: ResultCode.Success,
            message: 'package.json exports has required property.',
            realEntryPoint: entryPoint,
          },
    );

    this.processResult(result);

    return result;
  }

  protected async checkFilesExist(realEntryPoints: RealEntryPoint[]): Promise<Result[]> {
    return await Readable.from(unique(realEntryPoints, (entryPoint) => entryPoint.resolvedPath))
      .map(
        async (realEntryPoint: RealEntryPoint) => {
          const results = await checkFileExists(realEntryPoint);

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

  protected async checkSyntax(realEntryPoints: RealEntryPoint[]): Promise<Result[]> {
    const jsEntryPoints = realEntryPoints.filter((realEntryPoint) => /\.[cm]?js$/i.test(realEntryPoint.resolvedPath));

    return await Readable.from(unique(jsEntryPoints, (realEntryPoint) => realEntryPoint.resolvedPath))
      .map(
        async (realEntryPoint: RealEntryPoint) => {
          const results = await checkSyntax(realEntryPoint, { signal: this.#controller.signal });

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

  protected async verifyIncludes(realEntryPoints: RealEntryPoint[]): Promise<Result[]> {
    return (
      await Readable.from(unique(realEntryPoints, (entryPoint) => `${entryPoint.moduleName}-${entryPoint.type}`))
        .map(
          (entryPoint: RealEntryPoint) => {
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

    const results: Result[] = await Readable.from(unique(entryPoints, (entryPoint) => entryPoint.relativePath))
      // Remove entry points that are matching a dev condition.
      // The assumption is that files for dev conditions will not be packed.
      .filter(
        (entryPoint: EntryPoint) =>
          !(entryPoint.condition !== undefined && this.options.devCondition.includes(entryPoint.condition)),
      )
      .map(
        (entryPoint): Result => {
          const willBePacked = files.has(entryPoint.relativePath);

          return new Result({
            name: 'packlist',
            code: willBePacked ? ResultCode.Success : ResultCode.Error,
            message: willBePacked
              ? `${entryPoint.relativePath} will be packed.`
              : `${entryPoint.relativePath} will not be packed.`,
            error: willBePacked ? undefined : new Error('EntryPoint relativePath not found in packlist files.'),
            realEntryPoint: entryPoint,
          });
        },
        {
          signal: this.#controller.signal,
          concurrency: this.options.concurrency,
        },
      )
      .toArray({
        signal: this.#controller.signal,
      });

    this.processResults(results);

    return results;
  }

  async run(): Promise<ExitCode> {
    const packageJson = await readPackageJson(this.options.package);

    const packageContext: PackageContext = Object.freeze({
      name: packageJson.name,
      type: packageJson.type ?? 'commonjs',
      path: this.options.package,
      realPath: await realpath(this.options.package),
      directory: this.packageDirectory,
      realDirectory: await realpath(this.packageDirectory),
    });

    const entryPoints: RealEntryPoint[] = await Readable.from(getEntryPoints(packageJson, packageContext), {
      objectMode: true,
    })
      .map(getRealEntryPoint, {
        signal: this.#controller.signal,
      })
      .toArray({
        signal: this.#controller.signal,
      });

    const entryPointsWithErrors = new Set<RealEntryPoint>();

    const recordErrors = (results: Result[]): void => {
      results.forEach((result) => {
        if (result.code === ResultCode.Error) {
          entryPointsWithErrors.add(result.realEntryPoint);
        }
      });
    };

    const getNextEntryPoints = (items: RealEntryPoint[]): RealEntryPoint[] => {
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
