import { WritableStream, type UnderlyingSink } from 'node:stream/web';
import { inspect, stripVTControlCharacters, styleText } from 'node:util';

import { assertExhaustive } from '@webdeveric/utils/assertion';
import { graphemeLength } from '@webdeveric/utils/graphemeLength';
import { indent } from '@webdeveric/utils/indent';

import { ResultCode, type Result } from '@lib/Result.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

export interface TextWritableStreamOptions {
  info?: boolean;
  verbose?: boolean;
  destination?: WritableStream<Uint8Array>;
  highWaterMark?: number;
}

export class TextWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  info: boolean;

  verbose: boolean;

  readonly supportsColors: boolean;

  constructor(options: TextWritableStreamOptions = {}) {
    const { destination, info = false, verbose = false, highWaterMark = 1 } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    super(
      {
        write: async (record: Result) => {
          if (record.code !== ResultCode.Error && !info) {
            return;
          }

          await writer.write(encoder.encode(this.format(record) + '\n'));
        },
        close: async () => {
          await writer.close();
        },
        abort: async (reason?: unknown) => {
          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.destination = writable;
    this.info = info;
    this.verbose = verbose;
    this.supportsColors = !destination && process.stdout.isTTY && process.stdout.hasColors();
  }

  getIcon(resultCode: ResultCode): string {
    switch (resultCode) {
      case ResultCode.Success:
        return styleText(['greenBright'], '🗹');
      case ResultCode.Error:
        return styleText(['redBright'], '🗷');
      case ResultCode.Skip:
        return styleText(['whiteBright'], '🞏');
      default:
        assertExhaustive(resultCode, 'Unhandled ResultCode');
    }
  }

  format(result: Result): string {
    const iconPrefix = `${this.getIcon(result.code)} `;
    const prefix = `${iconPrefix}${result.name}: `;

    if (this.verbose) {
      const lines = [
        `${prefix}${result.message}`,
        indent(
          // spread the result to get rid of the mangled class name in the output.
          inspect({ ...result }, { colors: this.supportsColors }),
          ' '.repeat(graphemeLength(stripVTControlCharacters(iconPrefix))),
        ),
      ];

      return lines.join('\n');
    }

    const errorMessage =
      result.error && result.error.message !== result.message ? `Error: ${result.error.message}` : '';

    return `${prefix}${result.message} ${errorMessage}`;
  }
}
