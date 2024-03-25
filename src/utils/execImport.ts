import { asyncExec } from './asyncExec.js';

import type { ExecOptions } from 'node:child_process';

export async function execImport(path: string, options: ExecOptions): Promise<void> {
  const command = /\.json$/i.test(path)
    ? `node --input-type=module --eval="import '${path}' assert { type: 'json' };"`
    : `node --input-type=module --eval="import '${path}';"`;

  await asyncExec(command, options);
}
