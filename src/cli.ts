#!/usr/bin/env node

import { ResultCode, type Result } from '@lib/Result.js';
import { Validator } from '@lib/Validator.js';
import { ExitCode } from '@src/types.js';
import { getCliArguments } from '@utils/getCliArguments.js';

try {
  const { json, info, packages, ...validatorOptions } = await getCliArguments();

  const results: Result[] = [];

  const handleResult = (result: Result): void => {
    results.push(result);

    if (!json && (info || result.code === ResultCode.Error)) {
      console.log(result.toString());
    }
  };

  // Create a `Validator` for each `package.json`
  const validators = packages.map(path => {
    const validator = new Validator({
      ...validatorOptions,
      package: path,
    });

    validator.on('result', handleResult);

    return validator;
  });

  // Sequentially process each `package.json` file.
  for (const validator of validators) {
    await validator.run();
  }

  // Check if any of the results have an error code.
  process.exitCode = results.reduce<ExitCode>((code, result) => {
    if (result.code === ResultCode.Error) {
      return ExitCode.Error;
    }

    return code;
  }, ExitCode.Ok);

  if (json) {
    process.stdout.write(
      JSON.stringify(
        results.filter(result => info || result.code === ResultCode.Error),
        null,
        2,
      ),
    );
  }
} catch (error) {
  console.group(process.env.npm_package_name);
  console.error(error);
  console.groupEnd();

  process.exitCode ??= ExitCode.Error;
}
