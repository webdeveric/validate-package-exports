/**
 * Determine if input is being piped.
 */
export const isPipedInput = (): boolean => !process.stdin.isTTY;

/**
 * Determine if output is being piped.
 */
export const isPipedOutput = (): boolean => !process.stdout.isTTY;
