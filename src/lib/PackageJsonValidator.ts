import { realpath } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { Readable } from 'node:stream';

import { asError } from '@webdeveric/utils/asError';
import { unique } from '@webdeveric/utils/unique';

import { Result, ResultCode } from '@lib/Result.js';
import { ExitCode, type EntryPoint, type PackageContext, type PackageJson } from '@src/types.js';
import { checkFileExists } from '@utils/checkFileExists.js';
import { checkSyntax } from '@utils/checkSyntax.js';
import type { CliContext } from '@utils/createCliContext.js';
import { getEntryPoints } from '@utils/getEntryPoints.js';
import { getPacklist } from '@utils/getPacklist.js';
import { readPackageJson } from '@utils/readPackageJson.js';
import { resolvePackageJson } from '@utils/resolvePackageJson.js';
import { isSubpathExports } from '@utils/type-predicate.js';
import { verifyEntryPoint } from '@utils/verifyEntryPoint.js';

import type { TransformStreamDefaultController } from 'node:stream/web';

export type PackageValidatorOptions = {
  controller: TransformStreamDefaultController<Result>;
  cliContext: CliContext;
  /**
   * Path to `package.json`
   */
  path: string;
};

export class PackageJsonValidator {
  #cliContext: CliContext;

  readonly #path: string;

  #controller: TransformStreamDefaultController<Result>;

  #entryPointsWithError = new Set<EntryPoint>();

  constructor(options: PackageValidatorOptions) {
    this.#controller = options.controller;
    this.#cliContext = options.cliContext;
    this.#path = options.path;
  }

  get path(): string {
    return this.#path;
  }

  protected checkPackageJson(packageJson: PackageJson, packageContext: PackageContext): Result {
    const entryPoint: EntryPoint = {
      moduleName: `${packageContext.name}/package.json`,
      type: packageContext.type,
      fileName: 'package.json',
      resolvedPath: packageContext.path,
      // realResolvedPath: packageContext.realPath,
      relativePath: 'package.json',
      subpath: undefined,
      condition: [],
      directory: packageContext.directory,
      // realDirectory: packageContext.realDirectory,
      itemPath: [],
      packageContext,
    };

    return new Result(
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
  }

  #getNextEntryPoints = (items: EntryPoint[]): EntryPoint[] => {
    return items.filter((entryPoint) => !this.#entryPointsWithError.has(entryPoint));
  };

  protected async checkFilesExist(entryPoints: EntryPoint[]): Promise<void> {
    await Readable.from(entryPoints).forEach(
      async (entryPoint: EntryPoint) => {
        const result = await this.#cliContext.run(() => checkFileExists(entryPoint));

        this.#enqueue(result);
      },
      {
        signal: this.#cliContext.controller.signal,
        concurrency: this.#cliContext.options.concurrency,
      },
    );
  }

  #enqueue(result: Result): void {
    this.#controller.enqueue(result);

    if (result.code === ResultCode.Error) {
      if (result.entryPoint) {
        this.#entryPointsWithError.add(result.entryPoint);
      }

      if (this.#cliContext.options.bail) {
        this.#cliContext.controller.abort(new Error('Bailing out'));
      }
    }
  }

  protected async checkSyntax(entryPoints: EntryPoint[]): Promise<void> {
    await Readable.from(
      unique(entryPoints, {
        identity: (entryPoint) => entryPoint.resolvedPath,
        filter: (entryPoint) => {
          return /\.[cm]?js$/i.test(entryPoint.resolvedPath);
        },
      }),
    ).forEach(
      async (entryPoint: EntryPoint) => {
        const result = await this.#cliContext.run(() =>
          checkSyntax(entryPoint, { signal: this.#cliContext.controller.signal }),
        );

        this.#enqueue(result);
      },
      {
        signal: this.#cliContext.controller.signal,
        concurrency: this.#cliContext.options.concurrency,
      },
    );
  }

  protected async verifyIncludes(entryPoints: EntryPoint[]): Promise<void> {
    await Readable.from(
      unique(entryPoints, {
        // The identity must be made from more than only `moduleName` and `type`
        // since `.d.ts` files share the same `moduleName` and `type`.
        identity: (entryPoint) => `${entryPoint.moduleName}|${entryPoint.type}|${entryPoint.fileName}`,
      }),
    ).forEach(
      (entryPoint: EntryPoint) => {
        const results = verifyEntryPoint(entryPoint);

        for (const result of results) {
          this.#enqueue(result);
        }
      },
      {
        signal: this.#cliContext.controller.signal,
        concurrency: this.#cliContext.options.concurrency,
      },
    );
  }

  protected async checkPacklist(entryPoints: EntryPoint[], packlist: Set<string>): Promise<void> {
    await Readable.from(unique(entryPoints, { identity: (entryPoint) => entryPoint.relativePath }))
      // Remove entry points that are matching a dev condition.
      // The assumption is that files for dev conditions will not be packed.
      .filter(
        (entryPoint: EntryPoint) =>
          !entryPoint.condition.some((condition) => this.#cliContext.options.devCondition.includes(condition)),
      )
      .forEach(
        (entryPoint: EntryPoint): void => {
          const willBePacked = packlist.has(entryPoint.relativePath);

          this.#enqueue(
            new Result({
              name: 'packlist',
              code: willBePacked ? ResultCode.Success : ResultCode.Error,
              message: willBePacked
                ? `${entryPoint.relativePath} will be packed.`
                : `${entryPoint.relativePath} will not be packed.`,
              error: willBePacked ? undefined : new Error('EntryPoint relativePath not found in packlist files.'),
              entryPoint,
            }),
          );
        },
        {
          signal: this.#cliContext.controller.signal,
          concurrency: this.#cliContext.options.concurrency,
        },
      );
  }

  async run(): Promise<ExitCode> {
    let resolvedPath: string;

    try {
      resolvedPath = await resolvePackageJson(this.#path);
    } catch (err) {
      const error = asError(err);

      this.#enqueue(
        new Result({
          name: 'package-json',
          code: ResultCode.Error,
          message: error.message,
          error,
        }),
      );

      return ExitCode.Error;
    }

    let packageJson: PackageJson;

    try {
      // https://nodejs.org/docs/latest-v24.x/api/esm.html#resolution-algorithm
      packageJson = await readPackageJson(resolvedPath);
    } catch (err) {
      const error = asError(err);

      this.#enqueue(
        new Result({
          name: 'package-json',
          code: ResultCode.Error,
          message: `Unable to read package json data from "${relative(process.cwd(), resolvedPath)}".`,
          error,
        }),
      );

      return ExitCode.Error;
    }

    const realPath = await realpath(resolvedPath);

    const packageContext: PackageContext = Object.freeze({
      name: packageJson.name,
      type: packageJson.type ?? 'commonjs',
      path: resolvedPath,
      realPath,
      directory: dirname(resolvedPath),
      realDirectory: dirname(realPath),
    });

    // Check the structure of the `package.json` data.
    this.#enqueue(this.checkPackageJson(packageJson, packageContext));

    const entryPoints = await this.#cliContext.run(async (): Promise<EntryPoint[]> => {
      const data = await Array.fromAsync(getEntryPoints(packageJson, packageContext));

      return data.filter((item): item is EntryPoint => {
        if (item instanceof Result) {
          this.#enqueue(item);

          return false;
        }

        return true;
      });
    });

    await this.checkFilesExist(this.#getNextEntryPoints(entryPoints));

    await this.verifyIncludes(this.#getNextEntryPoints(entryPoints));

    const packlistPromise = this.#cliContext.run(async () => new Set(await getPacklist(packageContext.directory)));

    if (this.#cliContext.options.check) {
      await this.checkSyntax(this.#getNextEntryPoints(entryPoints));
    }

    const packlist = await packlistPromise;

    await this.checkPacklist(this.#getNextEntryPoints(entryPoints), packlist);

    return this.#entryPointsWithError.size > 0 ? ExitCode.Error : ExitCode.Ok;
  }
}
