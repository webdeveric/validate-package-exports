import { createInterface } from 'node:readline/promises';

export function readStdinLines(): AsyncIterable<string> {
  return createInterface({
    input: process.stdin,
    terminal: false,
  });
}
