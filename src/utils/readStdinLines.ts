import { createInterface } from 'node:readline/promises';

/**
 * Read non-blank lines from stdin.
 */
export async function* readStdinLines(): AsyncGenerator<string> {
  const lines = createInterface({
    input: process.stdin,
    terminal: false,
    crlfDelay: Infinity,
  });

  for await (const line of lines) {
    if (line.trim().length) {
      yield line;
    }
  }
}
