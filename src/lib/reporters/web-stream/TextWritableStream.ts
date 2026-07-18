import { WritableStream, type UnderlyingSink } from 'node:stream/web';
import { stripVTControlCharacters, styleText } from 'node:util';

import { assertExhaustive } from '@webdeveric/utils/assertion';
import { graphemeLength } from '@webdeveric/utils/graphemeLength';
import { isStringWithLength } from '@webdeveric/utils/predicate';

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
    const prefix = `${this.getIcon(result.code)} ${result.name}: `;

    const indent = ' '.repeat(graphemeLength(stripVTControlCharacters(prefix)));

    const itemPath =
      this.verbose && result.entryPoint?.itemPath.length
        ? `${indent}Item path: ${JSON.stringify(result.entryPoint.itemPath)}`
        : '';

    const conditions =
      this.verbose && result.entryPoint?.condition.length
        ? `${indent}Condition: ${JSON.stringify(result.entryPoint.condition)}`
        : '';

    const errorMessage =
      result.error && result.error.message !== result.message ? `${indent}Error: ${result.error.message}` : '';

    const lines = [`${prefix}${result.message}`, itemPath, conditions, errorMessage];

    return lines.filter(isStringWithLength).join('\n');
  }
}
