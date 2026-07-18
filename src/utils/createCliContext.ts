import { Semaphore } from '@lib/Semaphore.js';
import type { CliOptions } from '@src/types.js';
import { getCliOptions } from '@utils/getCliOptions.js';
import { isPipedInput, isPipedOutput } from '@utils/process.js';

export type CliContext = {
  options: CliOptions;
  controller: AbortController;
  pipingIn: boolean;
  pipingOut: boolean;
  run<Type>(fn: () => Promise<Type>): Promise<Type>;
};

export type CreateCliContextOptions = {
  args?: NodeJS.Process['argv'];
  controller?: AbortController;
  pipingIn?: boolean;
  pipingOut?: boolean;
};

/**
 * Build the shared context used throughout a CLI run: parsed options, an
 * `AbortController`, whether stdin/stdout are piped, and a `run` helper that
 * throttles concurrent async work.
 */
export function createCliContext({
  args,
  controller = new AbortController(),
  pipingIn = isPipedInput(),
  pipingOut = isPipedOutput(),
}: CreateCliContextOptions = {}): Readonly<CliContext> {
  const options = getCliOptions(args, pipingIn);

  const sem = new Semaphore(options.concurrency);

  return Object.freeze({
    options,
    controller,
    pipingIn,
    pipingOut,
    async run<Type>(fn: () => Promise<Type>): Promise<Type> {
      return sem.run(fn);
    },
  });
}
