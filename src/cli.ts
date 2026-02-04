#!/usr/bin/env node

import { setMaxListeners } from 'node:events';
import { Readable } from 'node:stream';

import { ResultCode, type Result } from '@lib/Result.js';
import { Validator } from '@lib/Validator.js';
import { ExitCode, type PackageJsonPath } from '@src/types.js';
import { getCliArguments } from '@utils/getCliArguments.js';
import { getDetails } from '@utils/getDetails.js';
import { resolvePackageJson } from '@utils/resolvePackageJson.js';

try {
  const { json, info, packages, ...options } = getCliArguments();

  const resolvedPackages: PackageJsonPath[] = await Readable.from(packages)
    .map((packagePath) => resolvePackageJson(packagePath), { concurrency: options.concurrency })
    .toArray();

  const results: Result[] = [];

  const handleResult = (result: Result): void => {
    results.push(result);

    if (!json && (info || result.code === ResultCode.Error)) {
      console.log(result.toString());
    }
  };

  const controller = new AbortController();

  setMaxListeners(100, controller.signal);

  // Create a `Validator` for each `package.json`
  const validators = resolvedPackages.map((path) => {
    const validator = new Validator({
      ...options,
      package: path,
      controller,
    });

    validator.on('result', handleResult);

    return validator;
  });

  try {
    // Sequentially process each `package.json` file.
    for (const validator of validators) {
      // eslint-disable-next-line no-await-in-loop
      await validator.run();
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      throw error;
    }
  }

  // Check if any of the results have an error code.
  process.exitCode = results.reduce<ExitCode>(
    (code, result) => (result.code === ResultCode.Error ? ExitCode.Error : code),
    ExitCode.Ok,
  );

  if (json) {
    process.stdout.write(
      JSON.stringify(
        results.filter((result) => info || result.code === ResultCode.Error),
        (_, value) => (value instanceof Error ? getDetails(value) : value),
        2,
      ),
    );
  }
} catch (error) {
  console.group(process.env.npm_package_name);
  console.dir(error, { depth: null });
  console.groupEnd();

  process.exitCode ??= ExitCode.Error;
}
