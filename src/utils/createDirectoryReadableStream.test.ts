import { Dirent } from 'node:fs';
import { tmpdir } from 'node:os';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { describe, expect, it } from 'vitest';

import { createDirectoryReadableStream } from './createDirectoryReadableStream.js';

describe('createDirectoryReadableStream()', () => {
  it('Returns a Readable', async () => {
    await expect(createDirectoryReadableStream(tmpdir())).resolves.toBeInstanceOf(Readable);
  });

  it('Reads a directory', async () => {
    const readable = await createDirectoryReadableStream(tmpdir());

    await expect(
      pipeline(
        readable,
        new Writable({
          objectMode: true,
          write(item: Dirent, _, callback) {
            expect(item).instanceOf(Dirent);

            callback();
          },
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
