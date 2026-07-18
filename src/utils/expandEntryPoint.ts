import { opendir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { countCharacter } from '@webdeveric/utils/countCharacter';
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
      // There should only ever be one `*`.
      entry[property] = value.replaceAll('*', starValue);
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
      if (item.name === 'node_modules') {
        continue;
      }

      yield* processDirectory(resolvedPath, entryPoint, context);
    } else if (item.isFile() && (typeof context.suffix === 'undefined' || item.name.endsWith(context.suffix))) {
      yield replaceStars(entryPoint, context.findStar(resolvedPath));
    }
  }
}

export async function* expandEntryPoint(entryPoint: EntryPoint): AsyncGenerator<EntryPoint> {
  const numberOfResolvedPathStars = countCharacter(entryPoint.resolvedPath, '*');
  const numberOfSubpathStars = entryPoint.subpath ? countCharacter(entryPoint.subpath, '*') : 0;

  if (numberOfResolvedPathStars === 0 && numberOfSubpathStars === 0) {
    yield entryPoint;

    return;
  }

  if (numberOfResolvedPathStars > 1) {
    throw new Error('Only one star is allowed in entryPoint.resolvedPath');
  }

  if (numberOfSubpathStars > 1) {
    throw new Error('Only one star is allowed in entryPoint.subpath');
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
