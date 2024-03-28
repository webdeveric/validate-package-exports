import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromTypes(
  packageJson: PackageJson,
  packageContext: PackageContext,
): Generator<EntryPoint> {
  const typesProperty = 'types' in packageJson ? 'types' : 'typings' in packageJson ? 'typings' : undefined;

  if (typesProperty) {
    const types = packageJson[typesProperty];

    if (types) {
      yield createEntryPoint({
        condition: 'types',
        itemPath: [typesProperty],
        modulePath: types,
        packageContext,
        subpath: undefined,
      });
    }
  }
}
