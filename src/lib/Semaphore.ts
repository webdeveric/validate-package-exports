/**
 * Limits how many async operations can run at the same time.
 *
 * @example
 * ```ts
 * const semaphore = new Semaphore(2); // allow at most 2 concurrent operations
 *
 * const urls = ['a', 'b', 'c', 'd'];
 *
 * await Promise.all(
 *   urls.map((url) => semaphore.run(() => fetch(url))),
 * );
 * ```
 */
export class Semaphore {
  readonly #limit: number;

  #running = 0;

  readonly #queue: ReturnType<typeof Promise.withResolvers<void>>[] = [];

  constructor(limit: number) {
    this.#limit = limit;
  }

  /**
   * Wait for a free slot, then run `fn`. Once `fn` settles, the slot is
   * freed and the next queued waiter, if any, is released.
   */
  async run<Type>(fn: () => Promise<Type>): Promise<Type> {
    if (this.#running >= this.#limit) {
      const waiter = Promise.withResolvers<void>();

      this.#queue.push(waiter);

      await waiter.promise;
    }

    ++this.#running;

    try {
      return await fn();
    } finally {
      --this.#running;

      this.#queue.shift()?.resolve();
    }
  }

  /**
   * Number of operations currently running.
   */
  get active(): number {
    return this.#running;
  }

  /**
   * Number of operations waiting for a free slot.
   */
  get queued(): number {
    return this.#queue.length;
  }
}
