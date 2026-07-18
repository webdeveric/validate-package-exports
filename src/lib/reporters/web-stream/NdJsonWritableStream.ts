import { WritableStream, type UnderlyingSink } from 'node:stream/web';

import { ResultCode, type Result } from '@lib/Result.js';
import { stdoutWritableStream } from '@utils/stdoutWritableStream.js';

import type { JsonValue } from '@webdeveric/utils/types';

export interface NdJsonWritableStreamOptions {
  info?: boolean;
  destination?: WritableStream<Uint8Array>;
  highWaterMark?: number;
}

export class NdJsonWritableStream extends WritableStream<Result> {
  readonly destination: WritableStream<Uint8Array>;

  constructor(options: NdJsonWritableStreamOptions = {}) {
    const { destination, highWaterMark = 1, info = false } = options;

    const encoder = new TextEncoder();
    const writable = destination ?? stdoutWritableStream();
    const writer = writable.getWriter();

    const writeJson = async (record: JsonValue): Promise<void> => {
      await writer.write(encoder.encode(JSON.stringify(record, null, 0) + '\n'));
    };

    super(
      {
        async write(record: Result) {
          if (record.code !== ResultCode.Error && !info) {
            return;
          }

          await writeJson(record);
        },
        async close() {
          await writer.close();
        },
        async abort(reason?: unknown) {
          // Write a sentinel entry so downstream readers know the output is truncated.
          await writeJson({
            STREAM_ABORTED: true,
            reason: String(reason),
          });

          await writer.abort(reason);
        },
      } satisfies UnderlyingSink<Result>,
      new CountQueuingStrategy({ highWaterMark }),
    );

    this.destination = writable;
  }
}
