import { ExportsProcessor } from '@lib/ExportsProcessor.js';
import type { EntryPoint, PackageContext, PackageJson } from '@src/types.js';

import { expandEntryPoint } from './expandEntryPoint.js';

export async function* getEntryPointsFromExports(
  packageJson: PackageJson,
  packageContext: PackageContext,
): AsyncGenerator<EntryPoint> {
  if (packageJson.exports) {
    const entryPoints = new ExportsProcessor().process(
      packageJson.exports,
      {
        itemPath: ['exports'],
      },
      packageContext,
    );

    for (const entryPoint of entryPoints) {
      yield* expandEntryPoint(entryPoint);
    }
  }
}
