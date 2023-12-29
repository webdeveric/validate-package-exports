import { cpus } from 'node:os';

import { describe, expect, it, vi } from 'vitest';

import { TaskQueue, type TaskQueueOptions } from '@lib/TaskQueue.js';
import { TaskStatus, type TaskRunContext } from '@src/types.js';
import { SleepTask } from '@tasks/SleepTask.js';

describe('TaskQueue', () => {
  const context: TaskQueueOptions['context'] = {
    packageDirectory: '.',
    packageJson: {
      name: 'demo',
      version: '0.0.0',
    },
  };

  describe('Options', () => {
    it('concurrency', () => {
      expect(
        new TaskQueue({
          concurrency: 10,
          context,
        }).concurrency,
      ).toEqual(10);

      expect(new TaskQueue({ context }).concurrency).toEqual(cpus().length);
    });
    it('tasks', () => {
      const queue = new TaskQueue({
        context,
        tasks: [new SleepTask(0), () => ({ name: 'task1', status: TaskStatus.Pass })],
      });

      expect(queue.size).toEqual(2);
    });
  });

  it('add() / delete()', () => {
    const task = new SleepTask(0);

    const queue = new TaskQueue({
      context: {
        packageDirectory: '',
        packageJson: {
          name: 'test',
          version: '0.0.0',
        },
      },
    });

    queue.add(task);

    expect(queue.size).toEqual(1);

    queue.delete(task);

    expect(queue.size).toEqual(0);
  });

  it('Runs Tasks', async () => {
    const queue = new TaskQueue({
      concurrency: 2,
      context: {
        packageDirectory: 'test',
        packageJson: {
          name: 'test',
          version: '0.0.0',
        },
      },
      tasks: [new SleepTask(0), () => ({ name: 'task1', status: TaskStatus.Pass })],
    });

    await expect(queue.run()).resolves.toEqual([
      {
        name: 'sleep',
        status: TaskStatus.Pass,
        context: {
          ms: 0,
        },
      },
      {
        name: 'task1',
        status: TaskStatus.Pass,
      },
    ]);
  });

  it('Tasks can abort the queue processing', async () => {
    const fn1 = vi.fn((context: TaskRunContext) => {
      context.queue.abort();

      return {
        name: 'test',
        status: TaskStatus.Fail,
      };
    });
    const fn2 = vi.fn();

    const queue = new TaskQueue({
      context,
      tasks: [fn1, fn2],
    });

    await expect(queue.run()).rejects.toBeInstanceOf(Error);
    expect(fn2).not.toHaveBeenCalled();
  });

  it('Tasks can add other tasks to the queue', async () => {
    const queue = new TaskQueue({
      concurrency: 10,
      context,
      tasks: [
        function demo(context) {
          context.queue.add(new SleepTask(1));

          return {
            name: demo.name,
            status: TaskStatus.Pass,
          };
        },
      ],
    });

    await expect(queue.run()).resolves.toEqual([
      {
        name: 'demo',
        status: TaskStatus.Pass,
      },
      {
        name: 'sleep',
        status: TaskStatus.Pass,
        context: {
          ms: 1,
        },
      },
    ]);
  });
});
