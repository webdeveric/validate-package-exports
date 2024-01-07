import { opendir } from 'node:fs/promises';
import { Readable, type ReadableOptions } from 'node:stream';

export async function createDirectoryReadableStream(
  directoryPath: string,
  options?: Omit<ReadableOptions, 'objectMode'>,
): Promise<Readable> {
  const dir = await opendir(directoryPath);

  return Readable.from(dir, { objectMode: true, ...options });
}
