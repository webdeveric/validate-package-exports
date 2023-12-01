import type { TaskRunContext, TaskResult } from '@src/types.js';

export abstract class Task {
  abstract name: string;

  abstract run(context: TaskRunContext): Promise<TaskResult>;
}
