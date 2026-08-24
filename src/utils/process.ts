import { fstatSync } from 'node:fs';

/**
 * Determine if input is being piped.
 *
 * `!process.stdin.isTTY` alone isn't enough: stdin is also non-TTY when it's
 * redirected from something like `/dev/null` (e.g. GitHub Actions `run:` steps
 * with no explicit input), which would incorrectly be treated as piped input.
 * Checking for a FIFO or a regular file distinguishes an actual pipe or file
 * redirection (`cmd | tool`, `tool < file`) from a redirected-but-empty stdin;
 * `/dev/null` reports as a character device, so it matches neither and this
 * correctly returns `false` on Linux and macOS runners.
 */
export const isPipedInput = (): boolean => {
  if (process.stdin.isTTY) {
    return false;
  }

  try {
    const stat = fstatSync(0);

    return stat.isFIFO() || stat.isFile();
  } catch {
    return false;
  }
};

/**
 * Determine if output is being piped.
 */
export const isPipedOutput = (): boolean => !process.stdout.isTTY;
