import { Task } from '@lib/Task.js';
import { TaskStatus, type TaskResult, type TaskRunContext } from '@src/types.js';

import { ResolvePathTask } from './ResolvePathTask.js';

export class ValidateBinTask extends Task {
  name = 'validate-bin';

  async run(context: TaskRunContext): Promise<TaskResult> {
    if (context.packageJson.bin) {
      Object.entries(context.packageJson.bin).forEach(([key, value]) => {
        context.queue.add(new ResolvePathTask(value, { key: `bin.${key}` }));
      });

      return {
        name: this.name,
        status: TaskStatus.Pass,
      };
    }

    return {
      name: this.name,
      status: TaskStatus.NoOp,
    };
  }
}
