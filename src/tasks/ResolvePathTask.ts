import { resolve } from 'node:path';

import { Task } from '@lib/Task.js';
import { TaskStatus, type TaskResult, type TaskRunContext } from '@src/types.js';
import { isReadable } from '@src/utils.js';

import type { UnknownRecord } from '@webdeveric/utils';

export class ResolvePathTask extends Task {
  name = 'resolve-path';

  constructor(
    protected readonly path: string,
    protected readonly context?: UnknownRecord,
  ) {
    super();
  }

  async run(context: TaskRunContext): Promise<TaskResult> {
    const resolved = resolve(context.packageDirectory, this.path);

    const pathIsReadable = await isReadable(resolved);

    if (pathIsReadable) {
      return {
        name: this.name,
        status: TaskStatus.Pass,
        context: {
          ...this.context,
          path: this.path,
          resolved,
        },
        debug: `${this.path} resolves to ${resolved}`,
      };
    }

    return {
      name: this.name,
      status: TaskStatus.Fail,
      context: {
        ...this.context,
        path: this.path,
        resolved,
        pathIsReadable,
      },
      error: `${this.path} was not resolved`,
    };
  }
}
