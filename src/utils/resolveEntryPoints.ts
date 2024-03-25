import { realpath } from 'node:fs/promises';
import { Readable } from 'node:stream';

import type { EntryPoint, ResolvedEntryPoint } from '@src/types.js';

export async function resolveEntryPoint(entryPoint: EntryPoint): Promise<ResolvedEntryPoint> {
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

export async function resolveEntryPoints(
  entryPoints: EntryPoint[],
  concurrency = 1,
  // signal?: AbortSignal,
): Promise<ResolvedEntryPoint[]> {
  return await Readable.from(entryPoints)
    .map(resolveEntryPoint, {
      concurrency,
      // signal
    })
    .toArray();
}
