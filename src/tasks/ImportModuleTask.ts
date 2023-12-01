import { createRequire } from 'node:module';

import { Task } from '@lib/Task.js';
import type { PackageType, TaskResult } from '@src/types.js';

const require = createRequire(import.meta.url);

export class ImportModuleTask extends Task {
  name = 'import-module';

  constructor(
    protected readonly moduleName: string,
    protected readonly type: PackageType,
  ) {
    super();
  }

  async run(): Promise<TaskResult> {
    console.group(`Validating ${this.moduleName}`);

    const checks = new Map();

    checks.set(`require('${this.moduleName}');`, () => {
      require(this.moduleName);
    });

    checks.set(`import('${this.moduleName}');`, async () => {
      await import(this.moduleName);
    });

    for (const [loadModule, fn] of checks) {
      try {
        await fn();

        console.log(`✅ ${loadModule}`);
      } catch (error) {
        console.log(`❌ ${loadModule}`);
        console.error(error);

        return {
          name: this.moduleName,
          success: false,
        };
      }
    }

    console.groupEnd();

    return {
      name: this.moduleName,
      success: true,
    };
  }
}
