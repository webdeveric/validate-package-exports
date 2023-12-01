import { cpus } from 'node:os';

import { describe, it, expect, vi } from 'vitest';

import { TaskQueue } from '@lib/TaskQueue.js';
import type { TaskRunContext } from '@src/types.js';
import { SleepTask } from '@tasks/SleepTask.js';

describe('TaskQueue', () => {
  describe('Options', () => {
    it('concurrency', () => {
      expect(
        new TaskQueue({
          concurrency: 10,
        }).concurrency,
      ).toEqual(10);

      expect(new TaskQueue().concurrency).toEqual(cpus().length);
    });
    it('tasks', () => {
      const queue = new TaskQueue({
        tasks: [new SleepTask(0), () => ({ name: 'task1', success: true })],
      });

      expect(queue.size).toEqual(2);
    });
  });

  it('add() / delete()', () => {
    const task = new SleepTask(0);

    const queue = new TaskQueue();

    queue.add(task);

    expect(queue.size).toEqual(1);

    queue.delete(task);

    expect(queue.size).toEqual(0);
  });

  it('Runs Tasks', async () => {
    const queue = new TaskQueue({
      concurrency: 2,
      tasks: [new SleepTask(0), () => ({ name: 'task1', success: true })],
    });

    await expect(queue.run()).resolves.toEqual([
      {
        name: 'sleep',
        success: true,
        context: {
          ms: 0,
        },
      },
      {
        name: 'task1',
        success: true,
      },
    ]);
  });

  it('Tasks can abort the queue processing', async () => {
    const fn1 = vi.fn((context: TaskRunContext) => {
      context.queue.abort();

      return {
        name: 'test',
        success: false,
      };
    });
    const fn2 = vi.fn();

    const queue = new TaskQueue({
      tasks: [fn1, fn2],
    });

    await expect(queue.run()).rejects.toBeInstanceOf(Error);
    expect(fn2).not.toHaveBeenCalled();
  });

  it('Tasks can add other tasks to the queue', async () => {
    const queue = new TaskQueue({
      concurrency: 10,
      tasks: [
        function demo(context) {
          context.queue.add(new SleepTask(1));

          return {
            name: demo.name,
            success: true,
          };
        },
      ],
    });

    await expect(queue.run()).resolves.toEqual([
      {
        name: 'demo',
        success: true,
      },
      {
        name: 'sleep',
        success: true,
        context: {
          ms: 1,
        },
      },
    ]);
  });
});
