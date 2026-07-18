import { fstatSync } from 'node:fs';

/**
 * Determine if input is being piped.
 *
 * `!process.stdin.isTTY` alone isn't enough: stdin is also non-TTY when it's
 * redirected from something like `/dev/null` (e.g. GitHub Actions `run:` steps),
 * which would incorrectly be treated as piped input. Checking for a FIFO
 * distinguishes an actual pipe from a redirected-but-empty stdin.
 */
export const isPipedInput = (): boolean => {
  if (process.stdin.isTTY) {
    return false;
  }

  try {
    return fstatSync(0).isFIFO();
  } catch {
    return false;
  }
};

/**
 * Determine if output is being piped.
 */
export const isPipedOutput = (): boolean => !process.stdout.isTTY;
