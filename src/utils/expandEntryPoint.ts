import { opendir } from 'node:fs/promises';

import type { EntryPoint } from '@src/types.js';

import { resolveDirent } from './resolveDirent.js';

export async function* expandEntryPoint(entryPoint: EntryPoint): AsyncGenerator<EntryPoint> {
  if (!entryPoint.resolvedPath.includes('*')) {
    yield entryPoint;

    return;
  }

  const [prefix, suffix] = entryPoint.resolvedPath.split('*');
  const prefixPattern = prefix ? new RegExp(`^${prefix}`, 'i') : undefined;
  const suffixPattern = suffix ? new RegExp(`${suffix}$`, 'i') : undefined;
  const properties = ['moduleName', 'relativePath', 'fileName', 'resolvedPath'] satisfies (keyof EntryPoint)[];

  const findStar = (path: string): string => {
    let star = path;

    if (prefixPattern) {
      star = star.replace(prefixPattern, '');
    }

    if (suffixPattern) {
      star = star.replace(suffixPattern, '');
    }

    return star;
  };

  const dir = await opendir(entryPoint.directory, {
    recursive: true,
  });

  for await (const item of dir) {
    if (item.isFile() && (typeof suffix == 'undefined' || item.name.endsWith(suffix))) {
      const star = findStar(resolveDirent(item));

      yield properties.reduce((entry, property) => {
        const value = entry[property];

        if (value) {
          entry[property] = value.replace('*', star);
        }

        return entry;
      }, structuredClone(entryPoint));
    }
  }
}
