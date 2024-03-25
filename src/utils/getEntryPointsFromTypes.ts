import type { EntryPoint, PackageJson } from '@src/types.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromTypes(packageJson: PackageJson, packageDirectory: string): Generator<EntryPoint> {
  const typesProperty = 'types' in packageJson ? 'types' : 'typings' in packageJson ? 'typings' : undefined;

  if (typesProperty) {
    const types = packageJson[typesProperty];

    if (types) {
      yield createEntryPoint({
        condition: 'types',
        itemPath: [typesProperty],
        modulePath: types,
        packageDirectory,
        packageName: packageJson.name,
        packageType: packageJson.type,
        subpath: undefined,
      });
    }
  }
}
