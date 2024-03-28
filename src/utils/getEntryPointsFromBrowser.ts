import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';
import { isPackageBrowserRecord } from '@utils/type-predicate.js';

import { createEntryPoint } from './createEntryPoint.js';

export function* getEntryPointsFromBrowser(
  packageJson: PackageJson,
  packageContext: PackageContext,
): Generator<EntryPoint> {
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
          packageContext,
          subpath: undefined,
        });
      }

      return;
    }

    yield createEntryPoint({
      condition: undefined,
      itemPath: ['browser'],
      modulePath: packageJson.browser,
      packageContext,
      subpath: undefined,
    });
  }
}
