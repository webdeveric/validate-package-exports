import { realpath } from 'node:fs/promises';

import type { EntryPoint, RealEntryPoint } from '@src/types.js';

/**
 * This uses `realpath()` to resolve symlinks for the `resolvedPath` and `directory` properties.
 */
export async function getRealEntryPoint(entryPoint: EntryPoint): Promise<RealEntryPoint> {
  const [realResolvedPath, realDirectory] = await Promise.all([
    realpath(entryPoint.resolvedPath),
    realpath(entryPoint.directory),
  ]);

  return {
    ...entryPoint,
    realResolvedPath,
    realDirectory,
  };
}
