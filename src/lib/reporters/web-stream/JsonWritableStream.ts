import { WritableStream, type UnderlyingSink } from 'node:stream/web';

import { ResultCode, type Result } from '@lib/Result.js';
import type { JsonStringifySpace } from '@src/types.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

export interface NdJsonWritableStreamOptions {
  destination?: WritableStream<Uint8Array>;
  space?: JsonStringifySpace;
  pretty?: boolean;
  highWaterMark?: number;
  info?: boolean;
}

const separator = {
  open: (space?: JsonStringifySpace) => (!space ? '[' : '[\n'),
  close: (space?: JsonStringifySpace) => (!space ? ']' : '\n]'),
  between: (space?: JsonStringifySpace) => (!space ? ',' : ',\n'),
} as const satisfies Record<string, (space?: JsonStringifySpace) => string>;

export class JsonWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  constructor(options: NdJsonWritableStreamOptions = {}) {
    const { destination, space = 0, highWaterMark = 1, info = false } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    let first = true;

    super(
      {
        async start(controller) {
          try {
            await writer.write(encoder.encode(separator.open(space)));
          } catch (error) {
            controller.error(error);
          }
        },
        async write(record: Result, controller) {
          if (record.code !== ResultCode.Error && !info) {
            return;
          }

          try {
            const prefix = first ? '' : separator.between(space);

            await writer.write(encoder.encode(prefix + JSON.stringify(record, null, space) + '\n'));

            first = false;
          } catch (error) {
            controller.error(error instanceof Error ? error : new Error('JSON serialization failed', { cause: error }));
          }
        },
        async close() {
          await writer.write(encoder.encode(separator.close(space)));
          await writer.close();
        },
        async abort(reason?: unknown) {
          // Write a sentinel entry so downstream readers know the array is truncated.
          const sentinel = JSON.stringify({
            STREAM_ABORTED: true,
            reason: String(reason),
          });

          await writer.write(encoder.encode((first ? '' : separator.between(space)) + sentinel));
          await writer.write(encoder.encode(separator.close(space)));

          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.destination = writable;
  }
}
