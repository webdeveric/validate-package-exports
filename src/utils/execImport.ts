import { asyncExec } from './asyncExec.js';
import { getNodeMajorVersion } from './getNodeMajorVersion.js';

import type { ExecOptions } from 'node:child_process';

const nodeVersion = getNodeMajorVersion();

export async function execImport(moduleName: string, resolvedPath: string, options: ExecOptions): Promise<void> {
  const command = /\.json$/i.test(resolvedPath)
    ? `node --input-type=module --eval="import '${moduleName}' ${nodeVersion < 20 ? 'assert' : 'with'} { type: 'json' };" --no-warnings`
    : `node --input-type=module --eval="import '${moduleName}';"`;

  await asyncExec(command, options);
}
