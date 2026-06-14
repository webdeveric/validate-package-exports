import { EventEmitter } from 'node:events';
import { realpath } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';

import { asArray } from '@webdeveric/utils/asArray';
import { unique } from '@webdeveric/utils/unique';

import {
  ExitCode,
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
    const realEntryPoint: RealEntryPoint = {
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
            realEntryPoint,
            error: new Error('"." is missing from exports.'),
          }
        : {
            name: 'package-json',
            code: ResultCode.Success,
            message: 'package.json exports has required property.',
            realEntryPoint,
          },
    );

    this.processResult(result);

    return result;
  }

  protected async checkFilesExist(realEntryPoints: RealEntryPoint[]): Promise<Result[]> {
    return await Readable.from(unique(realEntryPoints, (realEntryPoint) => realEntryPoint.resolvedPath))
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
      await Readable.from(
        unique(realEntryPoints, (realEntryPoint) => `${realEntryPoint.moduleName}-${realEntryPoint.type}`),
      )
        .map(
          (realEntryPoint: RealEntryPoint) => {
            const results = verifyEntryPoint(realEntryPoint);

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

  protected async checkPacklist(realEntryPoints: RealEntryPoint[], packageContext: PackageContext): Promise<Result[]> {
    const files = new Set(await getPacklist(packageContext.directory));

    const results: Result[] = await Readable.from(
      unique(realEntryPoints, (realEntryPoint) => realEntryPoint.relativePath),
    )
      // Remove entry points that are matching a dev condition.
      // The assumption is that files for dev conditions will not be packed.
      .filter(
        (realEntryPoint: RealEntryPoint) =>
          !(realEntryPoint.condition !== undefined && this.options.devCondition.includes(realEntryPoint.condition)),
      )
      .map(
        (realEntryPoint: RealEntryPoint): Result => {
          const willBePacked = files.has(realEntryPoint.relativePath);

          return new Result({
            name: 'packlist',
            code: willBePacked ? ResultCode.Success : ResultCode.Error,
            message: willBePacked
              ? `${realEntryPoint.relativePath} will be packed.`
              : `${realEntryPoint.relativePath} will not be packed.`,
            error: willBePacked ? undefined : new Error('EntryPoint relativePath not found in packlist files.'),
            realEntryPoint,
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

    const realEntryPoints: RealEntryPoint[] = await Readable.from(getEntryPoints(packageJson, packageContext), {
      objectMode: true,
    })
      .map(getRealEntryPoint, {
        signal: this.#controller.signal,
      })
      .toArray({
        signal: this.#controller.signal,
      });

    const realEntryPointsWithErrors = new Set<RealEntryPoint>();

    const recordErrors = (results: Result[]): void => {
      results.forEach((result) => {
        if (result.code === ResultCode.Error) {
          realEntryPointsWithErrors.add(result.realEntryPoint);
        }
      });
    };

    const getNextEntryPoints = (items: RealEntryPoint[]): RealEntryPoint[] => {
      return items.filter((realEntryPoint) => !realEntryPointsWithErrors.has(realEntryPoint));
    };

    // Check the structure of the `package.json` data.
    recordErrors([this.checkPackageJson(packageJson, packageContext)]);

    // Always check to see if the file exists.
    recordErrors(await this.checkFilesExist(realEntryPoints));

    // Optionally run a syntax check.
    if (this.options.check) {
      recordErrors(await this.checkSyntax(getNextEntryPoints(realEntryPoints)));
    }

    recordErrors(await this.verifyIncludes(getNextEntryPoints(realEntryPoints)));

    recordErrors(await this.checkPacklist(getNextEntryPoints(realEntryPoints), packageContext));

    // TODO: maybe do some reporting using `entryPointsWithErrors`

    return this.#exitCode;
  }
}
