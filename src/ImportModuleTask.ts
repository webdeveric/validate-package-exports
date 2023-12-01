import { createRequire } from 'node:module';

import { Task } from './task.js';

export type ModuleType = 'commonjs' | 'module';

const require = createRequire(import.meta.url);

export class ImportModuleTask extends Task {
  constructor(
    protected readonly name: string,
    protected readonly type: ModuleType,
  ) {
    super();
  }

  async run(): Promise<boolean> {
    console.group(`Validating ${this.name}`);

    const checks = new Map();

    checks.set(`require('${this.name}');`, () => {
      require(this.name);
    });

    checks.set(`import('${this.name}');`, async () => {
      await import(this.name);
    });

    for (const [loadModule, fn] of checks) {
      try {
        await fn();

        console.log(`✅ ${loadModule}`);
      } catch (error) {
        console.log(`❌ ${loadModule}`);
        console.error(error);

        return false;
      }
    }

    console.groupEnd();

    return true;
  }
}
