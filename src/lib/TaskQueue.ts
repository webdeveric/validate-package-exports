import { availableParallelism } from 'node:os';
import { Readable } from 'node:stream';

import { Task } from '@lib/Task.js';
import type { AnyTask, TaskResult, TaskRunContext } from '@src/types.js';

export type TaskQueueOptions = {
  concurrency?: number;
  tasks?: AnyTask[];
  context: Omit<TaskRunContext, 'queue'>;
};

export class TaskQueue {
  #tasks: Set<AnyTask>;

  #controller: AbortController;

  #concurrency: number;

  #context: TaskRunContext;

  constructor(options: TaskQueueOptions) {
    this.#tasks = new Set<AnyTask>(options?.tasks);
    this.#controller = new AbortController();
    this.#concurrency = options?.concurrency || availableParallelism();
    this.#context = {
      ...options.context,
      queue: this,
    };
  }

  get concurrency(): number {
    return this.#concurrency;
  }

  add(...tasks: AnyTask[]): this {
    tasks.forEach(task => this.#tasks.add(task));

    return this;
  }

  delete(...tasks: Task[]): this {
    tasks.forEach(task => this.#tasks.delete(task));

    return this;
  }

  abort(): void {
    this.#controller.abort();
  }

  get size(): number {
    return this.#tasks.size;
  }

  *tasks(): Generator<AnyTask> {
    for (const task of this.#tasks) {
      yield task;

      this.#tasks.delete(task);
    }
  }

  async run(): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    while (this.size) {
      results.push(
        ...(await Readable.from(this.tasks(), {
          emitClose: false,
          autoDestroy: false,
          signal: this.#controller.signal,
        })
          .map(async (task: AnyTask) => (task instanceof Task ? task.run(this.#context) : task(this.#context)), {
            concurrency: this.concurrency,
          })
          .toArray({
            signal: this.#controller.signal,
          })),
      );
    }

    return results;
  }
}
