import { WritableStream } from 'node:stream/web';

import { writeStream } from '@utils/writeStream.js';

/**
 * Creates a WHATWG `WritableStream` that pipes chunks to `process.stdout`,
 * respecting backpressure by waiting for the `drain` event when needed.
 *
 * @example
 * ```ts
 * await someReadable.pipeTo(stdoutWritableStream());
 * ```
 */
export function stdoutWritableStream(): WritableStream {
  return new WritableStream({
    write(chunk) {
      return writeStream(process.stdout, chunk);
    },
  });
}
