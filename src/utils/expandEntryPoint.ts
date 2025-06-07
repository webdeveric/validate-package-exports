import { opendir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { escapeRegExp } from '@webdeveric/utils/escapeRegExp';

import type { EntryPoint } from '@src/types.js';

type ExpandEntryPointContext = {
  prefix: string | undefined;
  suffix: string | undefined;
  prefixPattern: RegExp | undefined;
  suffixPattern: RegExp | undefined;
  findStar: (path: string) => string;
};

function replaceStars(entryPoint: EntryPoint, starValue: string): EntryPoint {
  const properties = ['moduleName', 'relativePath', 'fileName', 'resolvedPath'] satisfies (keyof EntryPoint)[];

  return properties.reduce((entry, property) => {
    const value = entry[property];

    if (value) {
      entry[property] = value.replace('*', starValue);
    }

    return entry;
  }, structuredClone(entryPoint));
}

async function* processDirectory(
  directory: string,
  entryPoint: EntryPoint,
  context: ExpandEntryPointContext,
): AsyncGenerator<EntryPoint> {
  const dir = await opendir(directory);

  for await (const item of dir) {
    const resolvedPath = resolve(directory, item.name);

    if (item.isDirectory()) {
      yield* processDirectory(resolvedPath, entryPoint, context);
    } else if (item.isFile() && (typeof context.suffix === 'undefined' || item.name.endsWith(context.suffix))) {
      yield replaceStars(entryPoint, context.findStar(resolvedPath));
    }
  }
}

export async function* expandEntryPoint(entryPoint: EntryPoint): AsyncGenerator<EntryPoint> {
  if (!entryPoint.resolvedPath.includes('*')) {
    yield entryPoint;

    return;
  }

  const [prefix, suffix] = entryPoint.resolvedPath.split('*');

  const context: ExpandEntryPointContext = {
    prefix,
    suffix,
    prefixPattern: prefix ? new RegExp(`^${escapeRegExp(prefix)}`, 'i') : undefined,
    suffixPattern: suffix ? new RegExp(`${escapeRegExp(suffix)}$`, 'i') : undefined,
    findStar(path: string): string {
      let star = path;

      if (this.prefixPattern) {
        star = star.replace(this.prefixPattern, '');
      }

      if (this.suffixPattern) {
        star = star.replace(this.suffixPattern, '');
      }

      return star;
    },
  };

  yield* processDirectory(entryPoint.directory, entryPoint, context);
}
