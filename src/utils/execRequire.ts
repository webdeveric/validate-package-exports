import { asyncExec } from './asyncExec.js';

import type { ExecOptions } from 'node:child_process';

export async function execRequire(path: string, options: ExecOptions): Promise<void> {
  const command = `node --input-type=commonjs --eval="require('${path}');"`;

  await asyncExec(command, options);
}
