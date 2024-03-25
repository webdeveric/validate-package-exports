import type { EntryPoint, PackageJson } from '@src/types.js';
import { isPackageBrowserRecord } from '@utils/type-predicate.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromBrowser(packageJson: PackageJson, packageDirectory: string): Generator<EntryPoint> {
  if (packageJson.browser) {
    if (isPackageBrowserRecord(packageJson.browser)) {
      const entries = Object.entries(packageJson.browser).filter(
        (entry): entry is [key: string, value: string] => typeof entry[0] === 'string' && typeof entry[1] === 'string',
      );

      for (const [key, value] of entries) {
        yield createEntryPoint({
          condition: undefined,
          itemPath: ['browser', key],
          modulePath: value,
          packageDirectory,
          packageName: packageJson.name,
          packageType: packageJson.type,
          subpath: undefined,
        });
      }

      return;
    }

    yield createEntryPoint({
      condition: undefined,
      itemPath: ['browser'],
      modulePath: packageJson.browser,
      packageDirectory,
      packageName: packageJson.name,
      packageType: packageJson.type,
      subpath: undefined,
    });
  }
}
