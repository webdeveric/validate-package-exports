import { once } from 'node:events';

import type { Writable } from 'node:stream';

/**
 * Writes a chunk to a writable stream, awaiting the `drain` event if the
 * stream's internal buffer is full so callers don't overwhelm slow consumers.
 */
export async function writeStream(
  stream: Writable,
  chunk: string | Buffer | Uint8Array<ArrayBufferLike>,
): Promise<void> {
  if (stream.write(chunk)) {
    return;
  }

  await once(stream, 'drain');
}
