import { AssertionError } from 'node:assert';

import { assertExhaustive } from '@webdeveric/utils/assertion';

import type { CliOptions } from '@src/types.js';

export async function getReporterWebStream(options: CliOptions): Promise<WritableStream> {
  switch (options.reporter) {
    case 'text': {
      const { TextWritableStream } = await import('@lib/reporters/web-stream/TextWritableStream.js');

      return new TextWritableStream({
        info: options.info,
        verbose: options.verbose,
      });
    }
    case 'ndjson': {
      const { NdJsonWritableStream } = await import('@lib/reporters/web-stream/NdJsonWritableStream.js');

      return new NdJsonWritableStream({
        info: options.info,
      });
    }
    case 'json': {
      const { JsonWritableStream } = await import('@lib/reporters/web-stream/JsonWritableStream.js');

      return new JsonWritableStream({
        space: options.verbose ? 2 : 0,
        info: options.info,
      });
    }
    case 'sarif': {
      const { SarifWritableStream } = await import('@lib/reporters/web-stream/SarifWritableStream.js');

      return new SarifWritableStream({
        toolName: process.env['npm_package_name']!,
        toolVersion: process.env['npm_package_version']!,
        informationUri: process.env['homepage']!,
        info: options.info,
        srcRoot: process.cwd(),
        space: options.verbose ? 2 : 0,
      });
    }
    default:
      assertExhaustive(
        options.reporter,
        new AssertionError({
          message: 'Invalid reporter',
          actual: options.reporter,
        }),
      );
  }
}
