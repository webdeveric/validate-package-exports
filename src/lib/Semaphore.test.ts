import { describe, expect, it } from 'vitest';

import { Semaphore } from './Semaphore.js';

describe('Semaphore', () => {
  it('Runs a task immediately when under the limit', async () => {
    const semaphore = new Semaphore(1);

    const result = await semaphore.run(() => Promise.resolve('done'));

    expect(result).toBe('done');
    expect(semaphore.active).toBe(0);
    expect(semaphore.queued).toBe(0);
  });

  it('Limits the number of concurrently running tasks', async () => {
    const semaphore = new Semaphore(2);

    const deferredItems = Array.from({ length: 4 }, () => Promise.withResolvers<void>());

    const tasks = deferredItems.map((deferred) => semaphore.run(() => deferred.promise));

    expect(semaphore.active).toBe(2);
    expect(semaphore.queued).toBe(2);

    deferredItems.forEach((deferred) => deferred.resolve());

    await Promise.all(tasks);

    expect(semaphore.active).toBe(0);
    expect(semaphore.queued).toBe(0);
  });

  it('Releases queued waiters as running tasks finish', async () => {
    const semaphore = new Semaphore(1);

    const order: number[] = [];

    const deferredA = Promise.withResolvers<void>();
    const deferredB = Promise.withResolvers<void>();

    const taskA = semaphore.run(async () => {
      await deferredA.promise;
      order.push(1);
    });

    const taskB = semaphore.run(async () => {
      await deferredB.promise;
      order.push(2);
    });

    expect(semaphore.active).toBe(1);
    expect(semaphore.queued).toBe(1);

    deferredA.resolve();
    await taskA;

    expect(semaphore.active).toBe(1);
    expect(semaphore.queued).toBe(0);

    deferredB.resolve();
    await taskB;

    expect(order).toEqual([1, 2]);
    expect(semaphore.active).toBe(0);
  });

  it('Frees the slot even when a task throws', async () => {
    const semaphore = new Semaphore(1);

    await expect(semaphore.run(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    expect(semaphore.active).toBe(0);
    expect(semaphore.queued).toBe(0);
  });

  it('Runs a queued task after a preceding task throws', async () => {
    const semaphore = new Semaphore(1);

    const deferred = Promise.withResolvers<void>();

    const first = semaphore.run(async () => {
      await deferred.promise;
      throw new Error('boom');
    });

    const second = semaphore.run(() => Promise.resolve('second'));

    expect(semaphore.queued).toBe(1);

    deferred.resolve();

    await expect(first).rejects.toThrow('boom');
    await expect(second).resolves.toBe('second');
  });

  it('Allows unlimited concurrency-like behavior when the limit is large', async () => {
    const semaphore = new Semaphore(10);

    const results = await Promise.all(Array.from({ length: 5 }, (_, i) => semaphore.run(() => Promise.resolve(i))));

    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(semaphore.queued).toBe(0);
  });
});
