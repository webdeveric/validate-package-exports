import { asyncExec } from './asyncExec.js';
import { getNodeMajorVersion } from './getNodeMajorVersion.js';

import type { ExecOptions } from 'node:child_process';

const nodeVersion = getNodeMajorVersion();

export async function execImport(path: string, options: ExecOptions): Promise<void> {
  const command = /\.json$/i.test(path)
    ? `node --input-type=module --eval="import '${path}' ${nodeVersion < 20 ? 'assert' : 'with'} { type: 'json' };" --no-warnings`
    : `node --input-type=module --eval="import '${path}';"`;

  await asyncExec(command, options);
}
