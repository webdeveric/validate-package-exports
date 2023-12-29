import { createRequire } from 'node:module';

import { Task } from '@lib/Task.js';
import { TaskStatus, type TaskResult, type TaskRunContext } from '@src/types.js';

export class ImportModuleTask extends Task {
  name = 'import-module';

  async run(context: TaskRunContext): Promise<TaskResult> {
    const require = createRequire(import.meta.url);

    const checks = new Map();

    checks.set(`require('${context.packageJson.name}');`, () => {
      console.log(require.resolve(context.packageJson.name));
      // require(context.packageJson.name);
    });

    checks.set(`import('${context.packageJson.name}');`, async () => {
      const resolved = await import.meta.resolve?.(context.packageJson.name);

      console.log(`import resolved = ${resolved}`);

      // await import(context.packageJson.name);
    });

    for (const [loadModule, fn] of checks) {
      try {
        await fn();

        console.log(`✅ ${loadModule}`);
      } catch (error) {
        console.log(`❌ ${loadModule}`);
        console.error(error);

        return {
          name: context.packageJson.name,
          status: TaskStatus.Fail,
        };
      }
    }

    console.groupEnd();

    return {
      name: context.packageJson.name,
      status: TaskStatus.Pass,
    };
  }
}
