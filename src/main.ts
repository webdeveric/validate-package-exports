import { ReadableStream, TransformStream } from 'node:stream/web';
import { inspect, styleText } from 'node:util';

import { asError } from '@webdeveric/utils/asError';
import { prefix } from '@webdeveric/utils/prefix';
import { unique } from '@webdeveric/utils/unique';

import { PackageJsonValidator } from '@lib/PackageJsonValidator.js';
import { ResultCode, Result } from '@lib/Result.js';
import { SignalError } from '@src/errors/SignalError.js';
import { ExitCode } from '@src/types.js';
import { createCliContext } from '@utils/createCliContext.js';
import { getReporterWebStream } from '@utils/getReporterWebStream.js';
import { helpScreen } from '@utils/help.js';
import { readStdinLines } from '@utils/readStdinLines.js';

const errorMessage = prefix.bind(null, styleText('red', `[${process.env['npm_package_name']}] `));

try {
  const cliContext = createCliContext();

  const { packages, ...options } = cliContext.options;

  if (options.version) {
    process.stdout.write(process.env['npm_package_version'] + '\n');

    process.exit(ExitCode.Ok);
  }

  if (options.help) {
    process.stdout.write(helpScreen(cliContext));

    process.exit(ExitCode.Ok);
  }

  process.once('SIGINT', (signal) => {
    const error = new SignalError(signal);

    // Double CTRL+C
    process.once('SIGINT', () => {
      process.stderr.write('\n' + errorMessage('Forced exit.\n'));
      process.exit(error.exitCode);
    });

    process.stderr.write('\n' + errorMessage(`${signal} received... finishing in progress work.\n`));

    cliContext.controller.abort(error);
  });

  const uniquePackages = unique(cliContext.pipingIn ? readStdinLines() : packages, {
    filter(item) {
      return item.trim().length > 0;
    },
  });

  const readable = ReadableStream.from(uniquePackages);

  const packageJsonProcessor = new TransformStream<string, Result>(
    {
      async transform(chunk, controller) {
        if (cliContext.controller.signal.aborted) {
          controller.terminate();

          return;
        }

        try {
          const validator = new PackageJsonValidator({
            controller, // Allow the validator instance to `enqueue()`
            cliContext,
            path: chunk,
          });

          const exitCode = await validator.run();

          if (exitCode !== ExitCode.Ok) {
            process.exitCode = exitCode;
          }
        } catch (error) {
          if (cliContext.controller.signal.aborted) {
            // Bail or SIGINT: close the readable side gracefully so queued results still flush.
            process.exitCode ??= ExitCode.Error;

            controller.terminate();

            return;
          }

          controller.enqueue(
            new Result({
              code: ResultCode.Error,
              error: asError(error),
              name: 'unexpected-error',
              message: 'An unexpected error has occurred.',
            }),
          );

          controller.error(error);
        }
      },
    },
    new CountQueuingStrategy({ highWaterMark: 1 }),
  );

  const output = await getReporterWebStream(cliContext.options);

  // The abort signal is intentionally not passed to the pipe so that queued results are flushed to the reporter.
  await readable.pipeThrough(packageJsonProcessor).pipeTo(output);

  if (cliContext.controller.signal.reason instanceof SignalError) {
    throw cliContext.controller.signal.reason;
  }
} catch (error) {
  if (error instanceof SignalError) {
    process.stderr.write(errorMessage(`${error.signalName} handled.... goodbye.\n`));

    process.exit(error.exitCode);
  } else {
    process.stderr.write(errorMessage(inspect(error)));

    process.exitCode ??= ExitCode.Error;
  }
}
