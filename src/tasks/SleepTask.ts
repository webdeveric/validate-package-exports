import { setTimeout } from 'node:timers/promises';

import { Task } from '@lib/Task.js';
import type { TaskResult } from '@src/types.js';

export class SleepTask extends Task {
  name = 'sleep';

  constructor(public readonly ms: number) {
    super();
  }

  async run(): Promise<TaskResult> {
    await setTimeout(this.ms);

    return {
      name: this.name,
      success: true,
      context: {
        ms: this.ms,
      },
    };
  }
}
