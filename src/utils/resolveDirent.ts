import { resolve } from 'node:path';

import type { Dirent } from 'node:fs';

export function resolveDirent(entry: Pick<Dirent, 'name' | 'path'>): string {
  return resolve(
    entry.path.endsWith(entry.name) ? entry.path.replace(new RegExp(`[/\\\\]${entry.name}$`, 'i'), '') : entry.path,
    entry.name,
  );
}
